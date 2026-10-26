<script lang="ts">
	import { onMount } from 'svelte'
	import api, { type CollectionDay } from '$lib/api'
	import Button from '$lib/Button.svelte'
	import ErrorBoundary from '$lib/ErrorBoundary.svelte'
	import SummaryTables from './SummaryTables.svelte'

	interface Props {
		searchOrder: (phrase: string) => void
		salePeriod: string
	}
	const { salePeriod, searchOrder }: Props = $props()

	let error: unknown = $state()
	let days: CollectionDay[] = $state([])
	let selectedDate: string | undefined = $state()
	const refresh = async () => {
		try {
			days = await api.admin.sales(salePeriod).collectionSummary()
			if (!days.some((x) => x.date === selectedDate)) {
				selectedDate = days[0]?.date
			}
		} catch (e) {
			error = e
		}
	}
	onMount(refresh)

	const selectedDay = $derived(days.find((x) => x.date === selectedDate))
	const totalOrderCount = $derived(days.reduce((acc, x) => acc + x.order_count, 0))
	const totalItemCount = $derived(days.reduce((acc, x) => acc + x.item_count, 0))
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-4">
		<Button onClick={refresh}>Refresh</Button>
	</div>
	<ErrorBoundary {error} />
	<div class="flex flex-col gap-1">
		<h2 class="text-xl">Collected Items per Day</h2>
		{#if days.length === 0}
			No orders have been collected yet.
		{:else}
			<table class="w-fit border border-black text-center">
				<thead>
					<tr>
						<th>Date</th>
						<th>Orders</th>
						<th>Items</th>
					</tr>
				</thead>
				<tbody>
					{#each days as day}
						<tr
							class="cursor-pointer odd:bg-gray-200"
							class:selected={day.date === selectedDate}
							onclick={() => (selectedDate = day.date)}
						>
							<td>{day.date}</td>
							<td>{day.order_count}</td>
							<td>{day.item_count}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="font-bold">
						<td>Total</td>
						<td>{totalOrderCount}</td>
						<td>{totalItemCount}</td>
					</tr>
				</tfoot>
			</table>
		{/if}
	</div>
	{#if selectedDay}
		<div class="flex flex-col gap-1">
			<h2 class="text-xl">Items Collected on {selectedDay.date}</h2>
			<span>
				{selectedDay.order_count} orders, {selectedDay.item_count} items
			</span>
			<SummaryTables entries={selectedDay.items} {searchOrder} />
		</div>
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
	tr.selected {
		@apply bg-blue-200;
	}
</style>
