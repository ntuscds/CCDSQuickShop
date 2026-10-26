<script lang="ts">
	import type { CartItem } from '$lib/cart'
	import type { ShopItem } from '$lib/shop'
	import EmptyState from '$lib/ui/EmptyState.svelte'
	import ProductCard from './ProductCard.svelte'

	interface Props {
		items: ShopItem[]
		cart: CartItem[]
		onAdd: (item: CartItem) => void
	}
	const { items, cart, onAdd }: Props = $props()

	// Only one product shows its options at a time.
	let expanded: string | undefined = $state()
	const toggle = (id: string) => () => {
		expanded = expanded === id ? undefined : id
	}
	const inCart = (id: string) =>
		cart.filter((x) => x.id === id).reduce((acc, x) => acc + x.amount, 0)
</script>

{#if items.length === 0}
	<EmptyState
		icon="shopping-bag"
		title="Nothing on sale right now"
		description="Check back later or follow SCDS Club for the next merch drop."
	/>
{:else}
	<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Products">
		{#each items as item (item.id)}
			<li class="min-w-0" class:col-span-full={expanded === item.id}>
				<ProductCard
					{item}
					expanded={expanded === item.id}
					onToggle={toggle(item.id)}
					inCartCount={inCart(item.id)}
					{onAdd}
				/>
			</li>
		{/each}
	</ul>
{/if}
