<script lang="ts">
	import api, { type StockCountEntry } from '$lib/api'
	import { formatDate } from '$lib/util'
	import Button from '$lib/Button.svelte'
	import ErrorBoundary from '$lib/ErrorBoundary.svelte'

	interface Props {
		salePeriod: string
	}
	const { salePeriod }: Props = $props()

	let date = $state(formatDate(new Date()).split(' ')[0])
	let entries: StockCountEntry[] = $state([])
	let loadedDate: string | undefined = $state()
	let dirty = $state(false)
	let error: unknown = $state()
	let saved = $state(false)

	const load = async (date: string) => {
		if (!date) return
		try {
			const resp = await api.admin.sales(salePeriod).stockCounts(date)
			entries = resp.entries
			loadedDate = resp.date
			dirty = false
			saved = false
		} catch (e) {
			error = e
		}
	}
	$effect(() => {
		load(date)
	})

	const save = async () => {
		if (!loadedDate) return
		try {
			const resp = await api.admin.sales(salePeriod).updateStockCounts(
				loadedDate,
				entries.map((x) => ({ ...x, opening: x.opening ?? null, closing: x.closing ?? null }))
			)
			entries = resp.entries
			dirty = false
			saved = true
		} catch (e) {
			error = e
		}
	}

	const canFillOpening = $derived(
		entries.some((x) => x.opening === null && x.previous_closing !== null)
	)
	const fillOpening = () => {
		entries = entries.map((x) => ({
			...x,
			opening: x.opening ?? x.previous_closing
		}))
		dirty = true
	}
	const markDirty = () => {
		dirty = true
		saved = false
	}

	// Stock that should be left over if every item that left the stock was
	// recorded as a collected order.
	const expected = (x: StockCountEntry) => (x.opening === null ? null : x.opening - x.collected)
	const difference = (x: StockCountEntry) => {
		const e = expected(x)
		if (e === null || x.closing === null) return null
		return x.closing - e
	}
	const formatDifference = (diff: number | null) => {
		if (diff === null) return '-'
		if (diff > 0) return `+${diff}`
		return `${diff}`
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

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-4">
		<label class="flex items-center gap-2">
			Collection Date
			<input type="date" bind:value={date} />
		</label>
		<Button onClick={() => load(date)} size="md">Reload</Button>
		<Button onClick={fillOpening} size="md" disabled={!canFillOpening}>
			Fill Opening from Previous Closing
		</Button>
		<Button onClick={save} size="md" disabled={!dirty}>Save</Button>
		{#if dirty}
			<span class="text-orange-700">Unsaved changes</span>
		{:else if saved}
			<span class="text-green-700">Saved</span>
		{/if}
	</div>
	<ErrorBoundary {error} />
	<p class="max-w-prose text-sm text-gray-700">
		Count the stock at the start of the collection day (Opening) and at the end (Closing).
		Difference is Closing − (Opening − Collected): a negative number means items are missing
		compared to the orders marked as collected, a positive number means there is more stock left
		than expected.
	</p>
	{#if entries.length === 0}
		No items have been sold in this sale period.
	{:else}
		<div class="flex flex-col gap-1">
			<h2 class="text-xl">Stock Opname for {loadedDate}</h2>
			<span>
				{#if completeEntries.length === 0}
					Enter opening and closing counts to compare against collected orders.
				{:else if mismatchCount === 0}
					<span class="text-green-700">
						All {completeEntries.length} counted items match the collected orders.
					</span>
				{:else}
					<span class="text-red-700">
						{mismatchCount} of {completeEntries.length} counted items do not match the collected orders.
					</span>
				{/if}
			</span>
		</div>
		<table class="w-fit border border-black text-center">
			<thead>
				<tr>
					<th>Item</th>
					<th>Variant</th>
					<th>Opening</th>
					<th>Collected</th>
					<th>Expected Closing</th>
					<th>Closing</th>
					<th>Difference</th>
				</tr>
			</thead>
			<tbody>
				{#each entries as entry, i}
					{@const diff = difference(entry)}
					<tr class="odd:bg-gray-200">
						<td class="text-left">{entry.name}</td>
						<td class="text-left">{entry.variant}</td>
						<td>
							<input
								type="number"
								min="0"
								bind:value={entries[i].opening}
								oninput={markDirty}
								placeholder={entry.previous_closing === null ? '' : `${entry.previous_closing}`}
							/>
						</td>
						<td>{entry.collected}</td>
						<td>{expected(entry) ?? '-'}</td>
						<td>
							<input type="number" min="0" bind:value={entries[i].closing} oninput={markDirty} />
						</td>
						<td class:mismatch={diff !== null && diff !== 0} class:match={diff === 0}>
							{formatDifference(diff)}
						</td>
					</tr>
				{/each}
			</tbody>
			{#if completeEntries.length > 0}
				<tfoot>
					<tr class="font-bold">
						<td class="text-left" colspan="2">Total (counted items)</td>
						<td>{totals.opening}</td>
						<td>{totals.collected}</td>
						<td>{totals.expected}</td>
						<td>{totals.closing}</td>
						<td class:mismatch={mismatchCount > 0} class:match={mismatchCount === 0}>
							{formatDifference(totals.difference)}
						</td>
					</tr>
				</tfoot>
			{/if}
		</table>
	{/if}
</div>

<style lang="postcss">
	th,
	td {
		@apply px-4 py-1;
	}
	tfoot {
		@apply border-t border-black;
	}
	input {
		@apply border border-black px-1;
	}
	input[type='number'] {
		@apply w-20 text-right;
	}
	td.mismatch {
		@apply bg-red-200 font-bold text-red-800;
	}
	td.match {
		@apply bg-green-200 text-green-800;
	}
</style>
