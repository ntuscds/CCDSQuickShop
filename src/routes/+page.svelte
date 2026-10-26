<script lang="ts">
	import { onMount } from 'svelte'
	import { calculateCartTotal, formatPrice, type CartItem } from '$lib/cart'
	import { pluralise } from '$lib/util'
	import AppBar from '$lib/ui/AppBar.svelte'
	import Badge from '$lib/ui/Badge.svelte'
	import Button from '$lib/ui/Button.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import { addFlag } from '$lib/ui/flags.svelte'
	import OrderLookupDialog from '$lib/OrderLookupDialog.svelte'

	import type { PageData } from './$types'
	import Cart from './Cart.svelte'
	import ProductList from './ProductList.svelte'

	const { data }: { data: PageData } = $props()

	let cart: CartItem[] = $state([])
	const addToCart = (item: CartItem) => {
		// Try to search for existing entries and add amount instead.
		for (let i = 0; i < cart.length; i++) {
			if (
				cart[i].id !== item.id ||
				cart[i].variant.length !== item.variant.length ||
				cart[i].amount + item.amount > 50
			) {
				continue
			}
			const variantMatch = cart[i].variant.every((x) =>
				item.variant.some((y) => x.type === y.type && x.option === y.option)
			)
			if (!variantMatch) {
				continue
			}
			// This is a match! Just add amount.
			cart[i].amount += item.amount
			return
		}
		cart = [...cart, item]
	}
	const onAdd = (item: CartItem) => {
		addToCart(item)
		addFlag({
			appearance: 'success',
			title: 'Added to cart',
			description: `${item.name} · ${item.variant.map((v) => v.option).join(', ')}`,
			actions: isDesktop ? undefined : [{ label: 'View cart', onClick: openCart }]
		})
	}

	const cartItemCount = $derived(cart.reduce((acc, x) => x.amount + acc, 0))
	const cartTotal = $derived(calculateCartTotal(cart))

	// On small screens the cart is a full-screen panel opened from the bottom bar.
	let isDesktop = $state(false)
	let cartOpen = $state(false)
	let cartHeading: HTMLElement | undefined = $state()
	let cartBarButton: HTMLButtonElement | undefined = $state()
	onMount(() => {
		const mq = window.matchMedia('(min-width: 768px)')
		const update = () => {
			isDesktop = mq.matches
			if (isDesktop) cartOpen = false
		}
		update()
		mq.addEventListener('change', update)
		return () => mq.removeEventListener('change', update)
	})
	const mobileCartOpen = $derived(cartOpen && !isDesktop)
	$effect(() => {
		document.body.style.overflow = mobileCartOpen ? 'hidden' : ''
	})
	// Keep notifications above the bottom cart bar on small screens.
	$effect(() => {
		const root = document.documentElement
		root.style.setProperty('--ds-flag-offset', !isDesktop && !cartOpen ? '88px' : '')
		return () => root.style.removeProperty('--ds-flag-offset')
	})
	const openCart = () => {
		cartOpen = true
		setTimeout(() => cartHeading?.focus())
	}
	const closeCart = () => {
		cartOpen = false
		cartBarButton?.focus()
	}
	const onKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && mobileCartOpen) closeCart()
	}

	let lookupOpen = $state(false)
</script>

<svelte:head><title>SCDS Merch Store</title></svelte:head>
<svelte:window onkeydown={onKeydown} />

<div inert={mobileCartOpen || undefined}>
	<AppBar>
		<Button appearance="subtle" onClick={() => (lookupOpen = true)}>
			{#snippet iconBefore()}<Icon name="magnifying-glass" class="size-4" />{/snippet}
			Find my order
		</Button>
	</AppBar>
</div>

<div
	class="mx-auto w-full max-w-page px-4 py-6 md:grid md:grid-cols-[minmax(0,1fr),360px] md:gap-8 lg:grid-cols-[minmax(0,1fr),400px]"
>
	<main id="main" class="min-w-0 pb-24 md:pb-0" inert={mobileCartOpen || undefined}>
		<div class="mb-6">
			<h1 class="text-h2 md:text-h1">Merch</h1>
			<p class="mt-1 text-ink-subtle">
				Choose your options, add to cart and pay securely by card. Collection details will be
				emailed to you.
			</p>
		</div>
		<ProductList items={data.items} {cart} {onAdd} />
	</main>

	<aside
		class="cart-panel"
		class:open={mobileCartOpen}
		inert={!isDesktop && !cartOpen ? true : undefined}
		role={mobileCartOpen ? 'dialog' : undefined}
		aria-modal={mobileCartOpen ? 'true' : undefined}
		aria-label="Cart"
	>
		<div class="cart-panel-inner">
			<Cart
				bind:cart
				availableCoupons={data.coupons}
				onClose={isDesktop ? undefined : closeCart}
				bind:heading={cartHeading}
			/>
		</div>
	</aside>
</div>

{#if !isDesktop && !cartOpen}
	<div class="fixed bottom-0 left-0 right-0 z-20 border-t border-line bg-surface p-3 md:hidden">
		<button
			type="button"
			class="ds-cart-bar"
			onclick={openCart}
			bind:this={cartBarButton}
			aria-label={`View cart, ${pluralise(cartItemCount, 'item')}, total S$ ${formatPrice(cartTotal / 100)}`}
		>
			<span class="flex items-center gap-2">
				<Icon name="cart" class="size-5" />
				<span>View cart</span>
				<Badge value={cartItemCount} appearance={cartItemCount > 0 ? 'primary' : 'default'} />
			</span>
			<span class="tabular-nums">S$ {formatPrice(cartTotal / 100)}</span>
		</button>
	</div>
{/if}

<OrderLookupDialog bind:open={lookupOpen} />

<style lang="postcss">
	.cart-panel {
		@apply fixed inset-0 z-30 translate-x-full overflow-y-auto bg-surface transition-transform;
		@apply md:static md:z-auto md:translate-x-0 md:overflow-visible md:bg-transparent md:transition-none;
	}
	.cart-panel.open {
		@apply translate-x-0;
	}
	.cart-panel-inner {
		@apply min-h-full p-4;
		@apply md:sticky md:top-[72px] md:max-h-[calc(100vh-88px)] md:min-h-0 md:overflow-y-auto md:rounded-ds-lg md:border md:border-line md:bg-surface-raised md:shadow-raised;
	}
	.ds-cart-bar {
		@apply flex h-12 w-full items-center justify-between rounded-ds bg-brand px-4 text-body font-medium text-ink-inverse transition-colors hover:bg-brand-hover active:bg-brand-pressed;
	}
</style>
