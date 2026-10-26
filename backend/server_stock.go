package main

import (
	"cmp"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"slices"
	"strconv"
	"time"

	"github.com/chanbakjsd/CCDSQuickShop/backend/db"
)

type CollectionDay struct {
	Date       string              `json:"date"`
	OrderCount int                 `json:"order_count"`
	ItemCount  int                 `json:"item_count"`
	Items      []OrderSummaryEntry `json:"items"`
}

type CollectionSummaryResponse struct {
	Days []CollectionDay `json:"days"`
}

func (s *Server) CollectionSummary(w http.ResponseWriter, req *http.Request) {
	if !s.authCheck(w, req) {
		return
	}
	salePeriod, ok := s.resolveSalePeriod(w, req, req.PathValue("sale_id"))
	if !ok {
		return
	}
	loc, ok := collectionLocation(w, req)
	if !ok {
		return
	}
	days, err := s.collectionDays(req.Context(), salePeriod, loc)
	if err != nil {
		slog.Error("error fetching collection summary", "err", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	if err := json.NewEncoder(w).Encode(CollectionSummaryResponse{
		Days: days,
	}); err != nil {
		slog.Error("error writing collection summary response", "err", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

type StockCountEntry struct {
	Name            string `json:"name"`
	Variant         string `json:"variant"`
	Opening         *int   `json:"opening"`
	Closing         *int   `json:"closing"`
	Collected       int    `json:"collected"`
	PreviousClosing *int   `json:"previous_closing"`
	// Total items in paid orders and how many were collected on earlier days;
	// their difference is the stock expected at the start of the day.
	Ordered         int `json:"ordered"`
	CollectedBefore int `json:"collected_before"`
}

type StockCountResponse struct {
	Date    string            `json:"date"`
	Entries []StockCountEntry `json:"entries"`
}

type StockCountUpdate struct {
	Entries []StockCountEntry `json:"entries"`
}

func (s *Server) StockCounts(w http.ResponseWriter, req *http.Request) {
	if !s.authCheck(w, req) {
		return
	}
	salePeriod, date, loc, ok := s.stockCountParams(w, req)
	if !ok {
		return
	}
	s.writeStockCounts(w, req.Context(), salePeriod, date, loc)
}

func (s *Server) SaveStockCounts(w http.ResponseWriter, req *http.Request) {
	if !s.authCheck(w, req) {
		return
	}
	salePeriod, date, loc, ok := s.stockCountParams(w, req)
	if !ok {
		return
	}
	var update StockCountUpdate
	if err := json.NewDecoder(req.Body).Decode(&update); err != nil {
		slog.Error("error parsing request", "err", err)
		http.Error(w, "Invalid Body", http.StatusBadRequest)
		return
	}
	for _, entry := range update.Entries {
		if entry.Name == "" {
			http.Error(w, "Item name must not be empty", http.StatusBadRequest)
			return
		}
		if (entry.Opening != nil && *entry.Opening < 0) || (entry.Closing != nil && *entry.Closing < 0) {
			http.Error(w, "Stock count must not be negative", http.StatusBadRequest)
			return
		}
	}
	ctx := req.Context()
	tx, err := s.DB.Begin()
	if err != nil {
		slog.Error("error starting stock count transaction", "err", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	queries := s.Queries.WithTx(tx)
	for _, entry := range update.Entries {
		if err := queries.UpsertStockCount(ctx, db.UpsertStockCountParams{
			SalePeriod:   salePeriod,
			CountDate:    date,
			ProductName:  entry.Name,
			Variant:      entry.Variant,
			OpeningCount: toNullInt64(entry.Opening),
			ClosingCount: toNullInt64(entry.Closing),
		}); err != nil {
			_ = tx.Rollback()
			slog.Error("error saving stock count", "err", err)
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
	}
	if err := tx.Commit(); err != nil {
		_ = tx.Rollback()
		slog.Error("error commiting stock counts", "err", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	s.writeStockCounts(w, ctx, salePeriod, date, loc)
}

func (s *Server) stockCountParams(w http.ResponseWriter, req *http.Request) (salePeriod int64, date string, loc *time.Location, ok bool) {
	salePeriod, ok = s.resolveSalePeriod(w, req, req.PathValue("sale_id"))
	if !ok {
		return 0, "", nil, false
	}
	date = req.PathValue("date")
	if _, err := time.Parse(time.DateOnly, date); err != nil {
		http.Error(w, "Invalid date, expected YYYY-MM-DD", http.StatusBadRequest)
		return 0, "", nil, false
	}
	loc, ok = collectionLocation(w, req)
	if !ok {
		return 0, "", nil, false
	}
	return salePeriod, date, loc, true
}

func (s *Server) writeStockCounts(w http.ResponseWriter, ctx context.Context, salePeriod int64, date string, loc *time.Location) {
	entries, err := s.stockCountEntries(ctx, salePeriod, date, loc)
	if err != nil {
		slog.Error("error fetching stock counts", "err", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	if err := json.NewEncoder(w).Encode(StockCountResponse{
		Date:    date,
		Entries: entries,
	}); err != nil {
		slog.Error("error writing stock count response", "err", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

// stockCountEntries lists every item sold in the sale period alongside its
// stock counts and the number of items collected on the given date.
func (s *Server) stockCountEntries(ctx context.Context, salePeriod int64, date string, loc *time.Location) ([]StockCountEntry, error) {
	entries := make(map[itemKey]*StockCountEntry)
	entryFor := func(name, variant string) *StockCountEntry {
		key := itemKey{name, variant}
		if entry, ok := entries[key]; ok {
			return entry
		}
		entry := &StockCountEntry{Name: name, Variant: variant}
		entries[key] = entry
		return entry
	}

	sold, err := s.Queries.OrderSummary(ctx, db.OrderSummaryParams{
		SalePeriod:        salePeriod,
		ShowOnlyCollected: false,
	})
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("error fetching sold items: %w", err)
	}
	for _, item := range sold {
		entryFor(item.ProductName, item.Variant).Ordered = int(item.Sum.Float64)
	}

	days, err := s.collectionDays(ctx, salePeriod, loc)
	if err != nil {
		return nil, err
	}
	for _, day := range days {
		switch {
		case day.Date == date:
			for _, item := range day.Items {
				entryFor(item.Name, item.Variant).Collected = item.Count
			}
		case day.Date < date:
			for _, item := range day.Items {
				entryFor(item.Name, item.Variant).CollectedBefore += item.Count
			}
		}
	}

	counts, err := s.Queries.ListStockCounts(ctx, salePeriod)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("error fetching stock counts: %w", err)
	}
	// Track the latest earlier closing count so it can be carried over as
	// the opening count of this day.
	previousDates := make(map[itemKey]string)
	for _, count := range counts {
		key := itemKey{count.ProductName, count.Variant}
		switch {
		case count.CountDate == date:
			entry := entryFor(count.ProductName, count.Variant)
			entry.Opening = fromNullInt64(count.OpeningCount)
			entry.Closing = fromNullInt64(count.ClosingCount)
		case count.CountDate < date && count.ClosingCount.Valid && count.CountDate > previousDates[key]:
			previousDates[key] = count.CountDate
			entryFor(count.ProductName, count.Variant).PreviousClosing = fromNullInt64(count.ClosingCount)
		}
	}

	result := make([]StockCountEntry, 0, len(entries))
	for _, entry := range entries {
		result = append(result, *entry)
	}
	slices.SortFunc(result, func(a, b StockCountEntry) int {
		return cmp.Or(cmp.Compare(a.Name, b.Name), cmp.Compare(a.Variant, b.Variant))
	})
	return result, nil
}

type itemKey struct {
	name    string
	variant string
}

// collectionDays groups collected items by the day they were collected in,
// with the most recent day first.
func (s *Server) collectionDays(ctx context.Context, salePeriod int64, loc *time.Location) ([]CollectionDay, error) {
	rows, err := s.Queries.CollectedOrderItems(ctx, salePeriod)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("error fetching collected items: %w", err)
	}
	type dayAggregate struct {
		orders map[string]struct{}
		items  map[itemKey]int
	}
	aggregates := make(map[string]*dayAggregate)
	for _, row := range rows {
		date := row.CollectionTime.Time.In(loc).Format(time.DateOnly)
		agg, ok := aggregates[date]
		if !ok {
			agg = &dayAggregate{
				orders: make(map[string]struct{}),
				items:  make(map[itemKey]int),
			}
			aggregates[date] = agg
		}
		agg.orders[row.OrderID] = struct{}{}
		agg.items[itemKey{row.ProductName, row.Variant}] += int(row.Amount)
	}
	days := make([]CollectionDay, 0, len(aggregates))
	for date, agg := range aggregates {
		day := CollectionDay{
			Date:       date,
			OrderCount: len(agg.orders),
			Items:      make([]OrderSummaryEntry, 0, len(agg.items)),
		}
		for key, count := range agg.items {
			day.ItemCount += count
			day.Items = append(day.Items, OrderSummaryEntry{
				Name:    key.name,
				Variant: key.variant,
				Count:   count,
			})
		}
		slices.SortFunc(day.Items, func(a, b OrderSummaryEntry) int {
			return cmp.Or(cmp.Compare(a.Name, b.Name), cmp.Compare(a.Variant, b.Variant))
		})
		days = append(days, day)
	}
	slices.SortFunc(days, func(a, b CollectionDay) int {
		return cmp.Compare(b.Date, a.Date)
	})
	return days, nil
}

// collectionLocation returns the timezone used to split collections into days.
// The frontend passes its UTC offset in minutes so that days match the admin's
// local calendar.
func collectionLocation(w http.ResponseWriter, req *http.Request) (*time.Location, bool) {
	offsetStr := req.URL.Query().Get("tz_offset")
	if offsetStr == "" {
		return time.UTC, true
	}
	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < -14*60 || offset > 14*60 {
		http.Error(w, "Invalid timezone offset", http.StatusBadRequest)
		return nil, false
	}
	return time.FixedZone("", offset*60), true
}

func toNullInt64(v *int) sql.NullInt64 {
	if v == nil {
		return sql.NullInt64{}
	}
	return sql.NullInt64{Int64: int64(*v), Valid: true}
}

func fromNullInt64(v sql.NullInt64) *int {
	if !v.Valid {
		return nil
	}
	i := int(v.Int64)
	return &i
}
