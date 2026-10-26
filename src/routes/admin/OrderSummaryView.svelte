<script lang="ts">
	import { goto } from '$app/navigation'
	import api, { type OrderSummary } from '$lib/api'
	import Button from '$lib/ui/Button.svelte'
	import ErrorBoundary from '$lib/ui/ErrorBoundary.svelte'
	import EmptyState from '$lib/ui/EmptyState.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import PageHeader from '$lib/ui/PageHeader.svelte'
	import Spinner from '$lib/ui/Spinner.svelte'
	import Tabs from '$lib/ui/Tabs.svelte'
	import StatTile from './StatTile.svelte'
	import SummaryTables from './SummaryTables.svelte'

	interface Props {
		salePeriod: string
	}
	const { salePeriod }: Props = $props()

	let view = $state('outstanding')
	let summary: OrderSummary | undefined = $state()
	let loading = $state(false)
	let error: unknown = $state()
	const refresh = async (showCollected = view === 'all') => {
		loading = true
		error = undefined
		try {
			summary = await api.admin.sales(salePeriod).orderSummary(showCollected)
		} catch (e) {
			error = e
		} finally {
			loading = false
		}
	}
	$effect(() => {
		refresh(view === 'all')
	})

	const totalOrderCount = $derived(
		(summary?.unfulfilled_order_count ?? 0) + (summary?.fulfilled_order_count ?? 0)
	)
	const fulfillmentRatio = $derived(
		(summary?.fulfilled_order_count ?? 0) / Math.max(1, totalOrderCount)
	)
	const itemCount = $derived(summary ? summary.unfulfilled.reduce((acc, x) => acc + x.count, 0) : 0)

	const searchOrder = (phrase: string) => goto(`/admin/collect?q=${encodeURIComponent(phrase)}`)
	const tabs = [
		{ id: 'outstanding', label: 'Outstanding' },
		{ id: 'all', label: 'All sold' }
	]
</script>

<svelte:head><title>Order summary - Admin</title></svelte:head>

<PageHeader
	title="Order summary"
	description="Paid orders in the selected sale period, by product and variant."
>
	{#snippet actions()}
		<Button onClick={() => refresh()} {loading}>
			{#snippet iconBefore()}<Icon name="arrow-path" class="size-4" />{/snippet}
			Refresh
		</Button>
	{/snippet}
</PageHeader>

<ErrorBoundary {error} />

<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
	<StatTile
		label="Fulfilled orders"
		value={`${summary?.fulfilled_order_count ?? 0} / ${totalOrderCount}`}
		hint={`${Math.round(fulfillmentRatio * 1000) / 10}% collected`}
	/>
	<StatTile label="Outstanding orders" value={summary?.unfulfilled_order_count ?? 0} />
	<StatTile label={view === 'all' ? 'Items sold' : 'Outstanding items'} value={itemCount} />
	<StatTile label="Paid orders" value={totalOrderCount} />
</div>

<Tabs {tabs} bind:value={view} label="Order summary view">
	{#snippet panel(tab)}
		<div class="flex flex-col gap-4">
			{#if loading && !summary}
				<div class="flex justify-center py-12"><Spinner size="large" /></div>
			{:else if summary}
				{#if tab.id === 'outstanding' && summary.order_id_samples.length > 0}
					<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
						<span class="text-ink-subtle">Outstanding order IDs:</span>
						{#each summary.order_id_samples as orderID (orderID)}
							<button type="button" class="ds-link" onclick={() => searchOrder(orderID)}
								>{orderID}</button
							>
						{/each}
						{#if summary.order_id_samples.length < summary.unfulfilled_order_count}
							<span class="text-ink-subtlest"
								>and {summary.unfulfilled_order_count - summary.order_id_samples.length} more</span
							>
						{/if}
					</div>
				{/if}
				{#if summary.unfulfilled.length === 0}
					<EmptyState
						compact
						icon="check-circle"
						title={tab.id === 'all' ? 'No items sold yet' : 'Everything has been collected'}
						description={tab.id === 'all'
							? 'Paid orders will appear here.'
							: 'There are no outstanding items.'}
					/>
				{:else}
					<p class="text-small text-ink-subtlest">Click a count to see the matching orders.</p>
					<SummaryTables entries={summary.unfulfilled} onSelect={searchOrder} />
				{/if}
			{/if}
		</div>
	{/snippet}
</Tabs>
