<script lang="ts">
	import { beforeNavigate } from '$app/navigation'
	import api, { type StockCountEntry } from '$lib/api'
	import { formatDate, pluralise } from '$lib/util'
	import Button from '$lib/ui/Button.svelte'
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte'
	import Dialog from '$lib/ui/Dialog.svelte'
	import EmptyState from '$lib/ui/EmptyState.svelte'
	import ErrorBoundary from '$lib/ui/ErrorBoundary.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import Lozenge from '$lib/ui/Lozenge.svelte'
	import NumberField from '$lib/ui/NumberField.svelte'
	import PageHeader from '$lib/ui/PageHeader.svelte'
	import SectionMessage from '$lib/ui/SectionMessage.svelte'
	import Spinner from '$lib/ui/Spinner.svelte'
	import TextField from '$lib/ui/TextField.svelte'
	import { addFlag } from '$lib/ui/flags.svelte'
	import StatTile from './StatTile.svelte'
	import { compareItemLabels } from './summary'

	interface Props {
		salePeriod: string
	}
	const { salePeriod }: Props = $props()

	// `date` is the loaded day; `dateInput` is what the date field shows.
	const today = formatDate(new Date()).split(' ')[0]
	let date = $state(today)
	let dateInput = $state(today)
	let entries: StockCountEntry[] = $state([])
	let loadedDate: string | undefined = $state()
	let dirty = $state(false)
	let loading = $state(true)
	let error: unknown = $state()

	const load = async (date: string) => {
		loading = true
		error = undefined
		try {
			const resp = await api.admin.sales(salePeriod).stockCounts(date)
			entries = sortEntries(resp.entries)
			loadedDate = resp.date
			dirty = false
		} catch (e) {
			error = e
		} finally {
			loading = false
		}
	}
	$effect(() => {
		load(date)
	})

	// Changing the day discards unsaved counts, so ask first.
	let pendingDate: string | undefined = $state()
	let discardOpen = $state(false)
	const onDateInput = () => {
		if (!dateInput || dateInput === date) return
		if (dirty) {
			pendingDate = dateInput
			discardOpen = true
		} else {
			date = dateInput
		}
	}
	const DISCARD_PROMPT = 'You have unsaved stock counts. Discard them?'
	beforeNavigate((nav) => {
		if (dirty && !window.confirm(DISCARD_PROMPT)) nav.cancel()
	})
	const onBeforeUnload = (e: BeforeUnloadEvent) => {
		if (!dirty) return
		e.preventDefault()
		e.returnValue = ''
	}

	let saving = $state(false)
	const save = async () => {
		if (!loadedDate) return
		saving = true
		error = undefined
		try {
			const resp = await api.admin.sales(salePeriod).updateStockCounts(
				loadedDate,
				entries.map((x) => ({ ...x, opening: x.opening ?? null, closing: x.closing ?? null }))
			)
			entries = sortEntries(resp.entries)
			dirty = false
			addFlag({ appearance: 'success', title: 'Stock counts saved', description: loadedDate })
		} catch (e) {
			error = e
		} finally {
			saving = false
		}
	}

	// Rows are ordered by product, then by variant with sizes in size order.
	const sortEntries = (list: StockCountEntry[]) =>
		[...list].sort((a, b) =>
			compareItemLabels(`${a.name}, ${a.variant}`, `${b.name}, ${b.variant}`)
		)

	// Stock expected at the start of the day: everything ordered that was not
	// collected on an earlier day.
	const expectedOpening = (x: StockCountEntry) => x.ordered - x.collected_before
	const suggestedOpening = (x: StockCountEntry) => x.previous_closing ?? expectedOpening(x)
	const canFillOpening = $derived(entries.some((x) => x.opening === null))
	const fillOpening = () => {
		entries = entries.map((x) => ({ ...x, opening: x.opening ?? suggestedOpening(x) }))
		dirty = true
	}
	const markDirty = () => {
		dirty = true
	}

	// Stock that should be left over if every item that left the stock was
	// recorded as a collected order.
	const expected = (x: StockCountEntry) => (x.opening == null ? null : x.opening - x.collected)
	const difference = (x: StockCountEntry) => {
		const e = expected(x)
		if (e === null || x.closing == null) return null
		return x.closing - e
	}
	const describeDifference = (diff: number | null) => {
		if (diff === null) return '—'
		if (diff === 0) return 'Matches'
		if (diff < 0) return `Short ${-diff}`
		return `Over ${diff}`
	}

	// Variant whose image is shown full size.
	let zoom: StockCountEntry | undefined = $state()

	// Rows are grouped by product; each group can be collapsed and the list filtered.
	let filter = $state('')
	const collapsed: Record<string, boolean> = $state({})
	const matchesFilter = (x: StockCountEntry) => {
		const q = filter.trim().toLowerCase()
		return !q || `${x.name} ${x.variant}`.toLowerCase().includes(q)
	}
	const groups = $derived.by(() => {
		const result: { name: string; rows: number[] }[] = []
		entries.forEach((entry, i) => {
			if (!matchesFilter(entry)) return
			const last = result[result.length - 1]
			if (last && last.name === entry.name) last.rows.push(i)
			else result.push({ name: entry.name, rows: [i] })
		})
		return result
	})
	const setAllCollapsed = (value: boolean) => {
		for (const group of groups) collapsed[group.name] = value
	}
	const groupTotals = (rows: number[]) => {
		const xs = rows.map((i) => entries[i])
		const sum = (f: (x: StockCountEntry) => number) => xs.reduce((acc, x) => acc + f(x), 0)
		const openingEntered = xs.filter((x) => x.opening != null)
		const closingEntered = xs.filter((x) => x.closing != null)
		return {
			ordered: sum((x) => x.ordered),
			expectedOpening: sum(expectedOpening),
			collected: sum((x) => x.collected),
			opening: openingEntered.length ? sum((x) => x.opening ?? 0) : null,
			closing: closingEntered.length ? sum((x) => x.closing ?? 0) : null,
			counted: xs.filter((x) => difference(x) !== null).length,
			mismatches: xs.filter((x) => (difference(x) ?? 0) !== 0).length
		}
	}

	const completeEntries = $derived(entries.filter((x) => difference(x) !== null))
	const mismatchCount = $derived(completeEntries.filter((x) => difference(x) !== 0).length)
	const totals = $derived({
		opening: completeEntries.reduce((acc, x) => acc + (x.opening ?? 0), 0),
		collected: completeEntries.reduce((acc, x) => acc + x.collected, 0),
		expected: completeEntries.reduce((acc, x) => acc + (expected(x) ?? 0), 0),
		closing: completeEntries.reduce((acc, x) => acc + (x.closing ?? 0), 0),
		difference: completeEntries.reduce((acc, x) => acc + (difference(x) ?? 0), 0)
	})
</script>

<svelte:head><title>Stock count - Admin</title></svelte:head>
<svelte:window onbeforeunload={onBeforeUnload} />

<PageHeader
	title="Stock count"
	description="Count the stock at the start and end of a collection day and compare it with the orders marked as collected."
/>

<div class="flex flex-wrap items-end gap-3">
	<TextField
		label="Collection day"
		type="date"
		bind:value={dateInput}
		oninput={onDateInput}
		class="w-48"
	/>
	<Button onClick={() => load(date)} {loading}>
		{#snippet iconBefore()}<Icon name="arrow-path" class="size-4" />{/snippet}
		Reload
	</Button>
	<Button onClick={fillOpening} disabled={!canFillOpening}>Fill empty opening counts</Button>
	{#if entries.length > 0}
		<TextField
			label="Filter items"
			bind:value={filter}
			placeholder="e.g. Hoodie, Navy, M"
			class="w-56"
		/>
		<div class="flex gap-3 pb-2">
			<Button appearance="link" onClick={() => setAllCollapsed(false)}>Expand all</Button>
			<Button appearance="link" onClick={() => setAllCollapsed(true)}>Collapse all</Button>
		</div>
	{/if}
</div>

<ErrorBoundary {error} />

{#if loading && entries.length === 0}
	<div class="flex justify-center py-12"><Spinner size="large" /></div>
{:else if entries.length === 0}
	<EmptyState
		icon="archive-box"
		title="No items sold in this sale period"
		description="Items appear here once orders are paid."
	/>
{:else}
	{#if completeEntries.length === 0}
		<SectionMessage appearance="information">
			Enter the opening and closing counts to compare them with the collected orders. Expected
			opening is the stock there should be at the start of the day (items ordered minus items
			collected on earlier days); empty Opening fields are pre-filled with the previous day's
			closing count, or the expected opening. Difference = closing − (opening − collected). "Short"
			means items are missing; "Over" means more stock is left than expected.
		</SectionMessage>
	{:else if mismatchCount === 0}
		<SectionMessage appearance="success">
			All {pluralise(completeEntries.length, 'counted item')} match the collected orders.
		</SectionMessage>
	{:else}
		<SectionMessage appearance="warning">
			{mismatchCount} of {pluralise(completeEntries.length, 'counted item')} do not match the collected
			orders.
		</SectionMessage>
	{/if}

	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		<StatTile label="Opening (counted items)" value={totals.opening} />
		<StatTile label="Collected" value={totals.collected} />
		<StatTile label="Closing (counted items)" value={totals.closing} />
		<StatTile
			label="Difference"
			value={describeDifference(completeEntries.length ? totals.difference : null)}
		/>
	</div>

	<div class="ds-table-wrap rounded-ds-lg border border-line bg-surface-raised">
		<table class="ds-table">
			<caption class="sr-only">Stock counts for {loadedDate}</caption>
			<thead>
				<tr>
					<th scope="col">Item</th>
					<th scope="col">Variant</th>
					<th scope="col" class="num">Ordered</th>
					<th scope="col" class="num">Expected opening</th>
					<th scope="col">Opening</th>
					<th scope="col" class="num">Collected</th>
					<th scope="col" class="num">Expected closing</th>
					<th scope="col">Closing</th>
					<th scope="col">Difference</th>
				</tr>
			</thead>
			{#each groups as group (group.name)}
				{@const t = groupTotals(group.rows)}
				{@const open = !collapsed[group.name]}
				<tbody class="ds-stock-group">
					<tr class="ds-stock-group-row">
						<th scope="row" colspan="2" class="text-left">
							<button
								type="button"
								class="flex items-center gap-2 rounded-ds-sm text-body font-semibold text-ink"
								aria-expanded={open}
								onclick={() => (collapsed[group.name] = open)}
							>
								<Icon
									name={open ? 'chevron-down' : 'chevron-right'}
									class="size-4 text-ink-subtle"
								/>
								<img
									src={entries[group.rows[0]].image_url}
									alt=""
									class="size-6 rounded-ds-sm border border-line object-cover"
									loading="lazy"
								/>
								{group.name}
								<span class="font-normal text-ink-subtle">
									· {pluralise(group.rows.length, 'variant')}
								</span>
							</button>
						</th>
						<td class="num">{t.ordered}</td>
						<td class="num">{t.expectedOpening}</td>
						<td class="num">{t.opening ?? '—'}</td>
						<td class="num">{t.collected}</td>
						<td class="num">{t.opening === null ? '—' : t.opening - t.collected}</td>
						<td class="num">{t.closing ?? '—'}</td>
						<td class="whitespace-nowrap">
							{#if t.mismatches > 0}
								<Lozenge appearance="removed"
									>{pluralise(t.mismatches, 'mismatch', 'mismatches')}</Lozenge
								>
							{:else if t.counted === group.rows.length}
								<Lozenge appearance="success">All match</Lozenge>
							{:else if t.counted > 0}
								<Lozenge>{t.counted} of {group.rows.length} counted</Lozenge>
							{/if}
						</td>
					</tr>
					{#if open}
						{#each group.rows as i (`${entries[i].name}|${entries[i].variant}`)}
							{@const entry = entries[i]}
							{@const diff = difference(entry)}
							<tr>
								<td></td>
								<td class="whitespace-nowrap">
									<span class="flex items-center gap-2">
										<button
											type="button"
											class="ds-thumb"
											onclick={() => (zoom = entry)}
											aria-label={`Show image of ${entry.name} ${entry.variant}`}
										>
											<img src={entry.image_url} alt="" loading="lazy" />
											<img src={entry.image_url} alt="" class="ds-thumb-preview" />
										</button>
										{entry.variant || 'No option'}
									</span>
								</td>
								<td class="num">{entry.ordered}</td>
								<td class="num">{expectedOpening(entry)}</td>
								<td>
									<NumberField
										label={`Opening count for ${entry.name} ${entry.variant}`}
										hideLabel
										compact
										min={0}
										bind:value={entries[i].opening}
										placeholder={`${suggestedOpening(entry)}`}
										oninput={markDirty}
										class="w-24"
									/>
								</td>
								<td class="num">{entry.collected}</td>
								<td class="num">{expected(entry) ?? '—'}</td>
								<td>
									<NumberField
										label={`Closing count for ${entry.name} ${entry.variant}`}
										hideLabel
										compact
										min={0}
										bind:value={entries[i].closing}
										oninput={markDirty}
										class="w-24"
									/>
								</td>
								<td class="whitespace-nowrap">
									{#if diff === null}
										<span class="text-ink-subtlest">—</span>
									{:else if diff === 0}
										<Lozenge appearance="success">Matches</Lozenge>
									{:else if diff < 0}
										<Lozenge appearance="removed" bold>Short {-diff}</Lozenge>
									{:else}
										<Lozenge appearance="moved">Over {diff}</Lozenge>
									{/if}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			{:else}
				<tbody>
					<tr
						><td colspan="9" class="py-6 text-center text-ink-subtle">No items match "{filter}".</td
						></tr
					>
				</tbody>
			{/each}
		</table>
	</div>

	<div class="ds-stock-footer">
		<Button appearance="primary" onClick={save} loading={saving}>
			Save counts for {loadedDate}
		</Button>
		{#if dirty}<Lozenge appearance="moved">Unsaved changes</Lozenge>{/if}
	</div>
{/if}

<ConfirmDialog
	bind:open={discardOpen}
	title="Discard unsaved counts?"
	message={`The counts you entered for ${loadedDate} have not been saved.`}
	confirmLabel="Discard and switch day"
	appearance="warning"
	onConfirm={() => {
		if (pendingDate) date = pendingDate
	}}
	onCancel={() => (dateInput = date)}
/>

<Dialog
	open={!!zoom}
	title={zoom ? `${zoom.name} · ${zoom.variant || 'No option'}` : ''}
	width="large"
	onclose={() => (zoom = undefined)}
>
	{#if zoom}
		<img
			src={zoom.image_url}
			alt={`Picture of ${zoom.name}`}
			class="mx-auto mb-4 max-h-[70vh] rounded-ds"
		/>
	{/if}
</Dialog>

<style lang="postcss">
	.ds-thumb {
		@apply relative inline-flex shrink-0 rounded-ds-sm;
	}
	.ds-thumb > img:first-child {
		@apply size-8 rounded-ds-sm border border-line bg-surface-sunken object-cover;
	}
	/* Larger preview while hovering or focusing the thumbnail. */
	.ds-thumb-preview {
		@apply pointer-events-none absolute left-10 top-1/2 z-20 hidden w-40 -translate-y-1/2 rounded-ds-lg border border-line bg-surface object-contain shadow-overlay;
	}
	.ds-thumb:hover .ds-thumb-preview,
	.ds-thumb:focus-visible .ds-thumb-preview {
		@apply block;
	}
	.ds-stock-group-row {
		@apply bg-surface-sunken;
	}
	.ds-stock-group-row th,
	.ds-stock-group-row td {
		@apply border-t border-line font-semibold;
	}
	.ds-stock-footer {
		@apply sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t border-line bg-surface px-4 py-3 md:-mx-6 md:px-6;
	}
</style>
