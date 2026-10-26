<script lang="ts">
	import { fade } from 'svelte/transition'
	import { flip } from 'svelte/animate'
	import { prefersReducedMotion } from 'svelte/motion'
	import {
		type CartItem,
		type Coupon,
		type OrderItem,
		applyCoupon,
		calculateCartTotal,
		formatPrice
	} from './cart'
	import InvoiceItem from './InvoiceItem.svelte'

	interface Props {
		items: (CartItem | OrderItem)[]
		coupon?: Coupon | undefined | null
		editable?: boolean
	}
	let { items = $bindable(), coupon = null, editable = false }: Props = $props()

	const totalBeforeDiscount = $derived(calculateCartTotal(items))
	const totalAfterDiscount = $derived(
		coupon ? Math.min(applyCoupon(items, coupon), totalBeforeDiscount) : totalBeforeDiscount
	)
	const discount = $derived(totalBeforeDiscount - totalAfterDiscount)

	const removeItem = (i: number) => () => {
		items.splice(i, 1)
	}
	const duration = $derived(prefersReducedMotion.current ? 0 : 150)
</script>

<ul class="divide-y divide-line">
	{#each items as item, i (item)}
		<li transition:fade={{ duration }} animate:flip={{ duration }}>
			<InvoiceItem
				bind:item={items[i]}
				{editable}
				onRemove={editable ? removeItem(i) : undefined}
			/>
		</li>
	{/each}
</ul>
<dl class="ds-totals">
	{#if discount > 0}
		<dt>Subtotal</dt>
		<dd>S$ {formatPrice(totalBeforeDiscount / 100)}</dd>
		<dt>
			Discount
			{#if coupon}<span class="text-ink-subtlest">({coupon.couponCode})</span>{/if}
		</dt>
		<dd class="text-success-text">− S$ {formatPrice(discount / 100)}</dd>
	{/if}
	<dt class="text-h4">Total</dt>
	<dd class="text-h4">S$ {formatPrice(totalAfterDiscount / 100)}</dd>
</dl>

<style lang="postcss">
	.ds-totals {
		@apply mt-3 grid grid-cols-[1fr,auto] gap-x-4 gap-y-1 border-t-2 border-line pt-3 text-ink-subtle;
	}
	.ds-totals dd {
		@apply text-right tabular-nums;
	}
	.ds-totals dt.text-h4,
	.ds-totals dd.text-h4 {
		@apply mt-1 text-ink;
	}
</style>
