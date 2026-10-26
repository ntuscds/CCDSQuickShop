<script lang="ts">
	import { page } from '$app/state'
	import { pluralise } from '$lib/util'
	import AppBar from '$lib/ui/AppBar.svelte'
	import Button from '$lib/ui/Button.svelte'
	import Card from '$lib/ui/Card.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import OrderLookupForm from '$lib/OrderLookupForm.svelte'
	import type { PageData } from './$types'
	import OrderPreview from './OrderPreview.svelte'

	const { data }: { data: PageData } = $props()
	const orders = $derived(data.orders)
	const query = $derived(decodeURIComponent(page.params.id))
	const isSingleOrder = $derived(orders.length === 1 && orders[0].id === query)
</script>

<svelte:head>
	<title>Orders - SCDS Merch Store</title>
</svelte:head>

<AppBar>
	<Button appearance="subtle" href="/">
		{#snippet iconBefore()}<Icon name="shopping-bag" class="size-4" />{/snippet}
		Back to store
	</Button>
</AppBar>
<main id="main" class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
	<div>
		<h1 class="text-h2 md:text-h1">
			{#if isSingleOrder}Order {query}{:else}Orders for {query}{/if}
		</h1>
		<p class="mt-1 text-ink-subtle">
			{pluralise(orders.length, 'order')} found. Show your order ID or matric card when collecting.
		</p>
	</div>

	{#each orders as order (order.id)}
		<OrderPreview {order} expanded={orders.length <= 2} userFacing />
	{/each}

	<Card title="Look up another order">
		<OrderLookupForm compact />
	</Card>
</main>
