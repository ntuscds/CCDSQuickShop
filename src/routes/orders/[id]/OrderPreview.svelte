<script lang="ts">
	import { slide } from 'svelte/transition'
	import { prefersReducedMotion } from 'svelte/motion'
	import type { Order } from '$lib/api'
	import { applyCoupon, calculateCartTotal, formatPrice } from '$lib/cart'
	import { formatFriendlyDate, pluralise } from '$lib/util'
	import Button from '$lib/ui/Button.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import Lozenge from '$lib/ui/Lozenge.svelte'
	import SectionMessage from '$lib/ui/SectionMessage.svelte'
	import Invoice from '$lib/Invoice.svelte'
	import { uid } from '$lib/ui/uid'

	interface Props {
		order: Order
		expanded?: boolean
		userFacing?: boolean
		onCollect?: () => unknown
		onCancel?: () => unknown
	}
	let {
		order,
		expanded = $bindable(false),
		userFacing = false,
		onCollect,
		onCancel
	}: Props = $props()

	type Status = 'collected' | 'cancelled' | 'pending' | 'confirmed'
	const status = $derived<Status>(
		order.collectionTime !== null
			? 'collected'
			: order.cancelled
				? 'cancelled'
				: order.paymentTime === null
					? 'pending'
					: 'confirmed'
	)
	const lozengeAppearance: Record<Status, 'default' | 'removed' | 'moved' | 'success'> = {
		collected: 'default',
		cancelled: 'removed',
		pending: 'moved',
		confirmed: 'success'
	}
	const lozengeLabel = $derived(
		{
			collected: 'Collected',
			cancelled: 'Cancelled',
			pending: 'Payment pending',
			confirmed: userFacing ? 'Confirmed' : 'Ready to collect'
		}[status]
	)
	const itemCount = $derived(order.items.reduce((acc, x) => acc + x.amount, 0))
	const subtotal = $derived(calculateCartTotal(order.items))
	const total = $derived(
		order.coupon ? Math.min(applyCoupon(order.items, order.coupon), subtotal) : subtotal
	)
	const muted = $derived(status === 'collected' || status === 'cancelled')

	const bodyId = uid('order')
	const duration = $derived(prefersReducedMotion.current ? 0 : 200)
	const mailto = $derived(
		`mailto:scds-business@e.ntu.edu.sg?subject=${encodeURIComponent(`[Merch Shop] Order ${order.id}`)}`
	)
</script>

<article class="ds-order" class:muted>
	<button
		type="button"
		class="flex w-full items-start gap-3 p-4 text-left"
		aria-expanded={expanded}
		aria-controls={bodyId}
		onclick={() => (expanded = !expanded)}
	>
		<span class="min-w-0 flex-1">
			<span class="flex flex-wrap items-center gap-2">
				<span class="text-h4">Order {order.id}</span>
				<Lozenge appearance={lozengeAppearance[status]}>{lozengeLabel}</Lozenge>
			</span>
			<span class="mt-1 block text-small text-ink-subtle">
				{pluralise(itemCount, 'item')} · S$ {formatPrice(total / 100)}
				{#if !userFacing}· {order.name} · {order.matricNumber}{/if}
				{#if order.paymentTime}· paid {formatFriendlyDate(order.paymentTime, false)}{/if}
				· {order.salePeriod}
			</span>
		</span>
		<Icon name={expanded ? 'chevron-up' : 'chevron-down'} class="size-5 text-ink-subtle" />
	</button>

	{#if expanded}
		<div
			id={bodyId}
			class="flex flex-col gap-4 border-t border-line p-4"
			transition:slide={{ duration }}
		>
			{#if userFacing}
				{#if status === 'confirmed'}
					<SectionMessage appearance="success" title="Your order is confirmed">
						Collection details will be sent to {order.email}. Show this order ID or your matric card
						at the collection booth.
					</SectionMessage>
				{:else if status === 'pending'}
					<SectionMessage appearance="warning" title="Waiting for payment confirmation">
						We are waiting for confirmation from our payment provider. If you have already paid,
						refresh this page after a few moments.
						{#snippet actions()}
							<Button appearance="link" onClick={() => window.location.reload()}>Refresh</Button>
						{/snippet}
					</SectionMessage>
				{:else if status === 'collected'}
					<SectionMessage appearance="information" title="Enjoy your merch!">
						You collected this order on {formatFriendlyDate(order.collectionTime)}. Enjoy your
						merch!
					</SectionMessage>
				{:else}
					<SectionMessage appearance="error" title="This order was cancelled">
						This is usually because payment was not completed. Contact SCDS Club if you think this
						is a mistake.
						{#snippet actions()}
							<a href={mailto} class="ds-link">Contact us</a>
						{/snippet}
					</SectionMessage>
				{/if}
			{/if}

			<dl class="ds-order-details">
				<dt>Name</dt>
				<dd>{order.name}</dd>
				<dt>Matric number</dt>
				<dd>{order.matricNumber}</dd>
				{#if order.collectionTime}
					<dt>Collected</dt>
					<dd>{formatFriendlyDate(order.collectionTime)}</dd>
				{/if}
				{#if !userFacing}
					<dt>Email</dt>
					<dd>{order.email}</dd>
				{/if}
			</dl>

			<Invoice items={order.items} coupon={order.coupon} />

			<details class="group">
				<summary class="ds-link inline-flex cursor-pointer list-none items-center gap-1">
					<Icon name="chevron-right" class="size-4 transition-transform group-open:rotate-90" />
					Payment details
				</summary>
				<dl class="ds-order-details mt-2">
					<dt>Payment reference</dt>
					<dd class="break-all">{order.paymentRef || 'N/A'}</dd>
					<dt>Payment time</dt>
					<dd>{formatFriendlyDate(order.paymentTime)}</dd>
					{#if userFacing}
						<dt>Email</dt>
						<dd>{order.email}</dd>
					{/if}
					{#if order.coupon}
						<dt>Coupon</dt>
						<dd>{order.coupon.couponCode}</dd>
					{/if}
				</dl>
			</details>

			{#if (onCollect && order.collectionTime === null) || (onCancel && order.paymentTime === null && !order.cancelled)}
				<div class="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
					{#if onCancel && order.paymentTime === null && !order.cancelled}
						<Button appearance="subtle" onClick={onCancel}>Cancel order</Button>
					{/if}
					{#if onCollect && order.collectionTime === null}
						<Button appearance="primary" onClick={onCollect}>
							{#snippet iconBefore()}<Icon name="check" class="size-4" />{/snippet}
							Mark as collected ({pluralise(itemCount, 'item')})
						</Button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</article>

<style lang="postcss">
	.ds-order {
		@apply overflow-hidden rounded-ds-lg border border-line bg-surface-raised shadow-raised;
	}
	.ds-order.muted {
		@apply bg-surface-sunken;
	}
	.ds-order-details {
		@apply grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[auto,1fr];
	}
	.ds-order-details dt {
		@apply text-small font-semibold text-ink-subtle sm:py-0.5;
	}
	.ds-order-details dd {
		@apply mb-2 sm:mb-0 sm:py-0.5;
	}
</style>
