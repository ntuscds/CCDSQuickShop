-- migrate:up
CREATE TABLE stock_counts (
	sale_period   INTEGER NOT NULL REFERENCES sale_periods(id),
	-- Date of the collection day in YYYY-MM-DD format.
	count_date    TEXT    NOT NULL,
	product_name  TEXT    NOT NULL,
	variant       TEXT    NOT NULL,
	opening_count INTEGER,
	closing_count INTEGER,
	PRIMARY KEY (sale_period, count_date, product_name, variant)
);

-- migrate:down
DROP TABLE stock_counts;
