<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import api, { type CollectionDay } from '$lib/api'
	import { pluralise } from '$lib/util'
	import Button from '$lib/ui/Button.svelte'
	import EmptyState from '$lib/ui/EmptyState.svelte'
	import ErrorBoundary from '$lib/ui/ErrorBoundary.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import PageHeader from '$lib/ui/PageHeader.svelte'
	import Spinner from '$lib/ui/Spinner.svelte'
	import StatTile from './StatTile.svelte'
	import SummaryTables from './SummaryTables.svelte'

	interface Props {
		salePeriod: string
	}
	const { salePeriod }: Props = $props()

	let days: CollectionDay[] = $state([])
	let selectedDate: string | undefined = $state()
	let loading = $state(true)
	let error: unknown = $state()
	const refresh = async () => {
		loading = true
		error = undefined
		try {
			days = await api.admin.sales(salePeriod).collectionSummary()
			if (!days.some((x) => x.date === selectedDate)) {
				selectedDate = days[0]?.date
			}
		} catch (e) {
			error = e
		} finally {
			loading = false
		}
	}
	onMount(refresh)

	const selectedDay = $derived(days.find((x) => x.date === selectedDate))
	const totalOrderCount = $derived(days.reduce((acc, x) => acc + x.order_count, 0))
	const totalItemCount = $derived(days.reduce((acc, x) => acc + x.item_count, 0))
	const searchOrder = (phrase: string) => goto(`/admin/collect?q=${encodeURIComponent(phrase)}`)
	const friendly = (date: string) =>
		new Date(`${date}T00:00:00`).toLocaleDateString('en-SG', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		})
</script>

<svelte:head><title>Daily collection - Admin</title></svelte:head>

<PageHeader
	title="Daily collection"
	description="Orders and items collected on each day of this sale period."
>
	{#snippet actions()}
		<Button onClick={refresh} {loading}>
			{#snippet iconBefore()}<Icon name="arrow-path" class="size-4" />{/snippet}
			Refresh
		</Button>
	{/snippet}
</PageHeader>

<ErrorBoundary {error} />

{#if loading && days.length === 0}
	<div class="flex justify-center py-12"><Spinner size="large" /></div>
{:else if days.length === 0}
	<EmptyState
		icon="calendar"
		title="No collections yet"
		description="Days appear here once orders are marked as collected."
	/>
{:else}
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		<StatTile label="Collection days" value={days.length} />
		<StatTile label="Orders collected" value={totalOrderCount} />
		<StatTile label="Items collected" value={totalItemCount} />
	</div>

	<div class="grid gap-4 lg:grid-cols-[320px,minmax(0,1fr)]">
		<div class="ds-table-wrap self-start rounded-ds-lg border border-line bg-surface-raised">
			<table class="ds-table">
				<caption class="sr-only">Collection days</caption>
				<thead>
					<tr>
						<th scope="col">Day</th>
						<th scope="col" class="num">Orders</th>
						<th scope="col" class="num">Items</th>
					</tr>
				</thead>
				<tbody>
					{#each days as day (day.date)}
						<tr class:is-selected={day.date === selectedDate}>
							<td>
								<button
									type="button"
									class="ds-link text-left"
									aria-pressed={day.date === selectedDate}
									onclick={() => (selectedDate = day.date)}
								>
									{friendly(day.date)}
								</button>
							</td>
							<td class="num">{day.order_count}</td>
							<td class="num">{day.item_count}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<td>Total</td>
						<td class="num">{totalOrderCount}</td>
						<td class="num">{totalItemCount}</td>
					</tr>
				</tfoot>
			</table>
		</div>

		{#if selectedDay}
			<div class="flex flex-col gap-3">
				<div>
					<h2 class="text-h3">{friendly(selectedDay.date)}</h2>
					<p class="text-ink-subtle">
						{pluralise(selectedDay.order_count, 'order')} · {pluralise(
							selectedDay.item_count,
							'item'
						)} collected
					</p>
				</div>
				<SummaryTables entries={selectedDay.items} onSelect={searchOrder} />
			</div>
		{/if}
	</div>
{/if}
