<script lang="ts">
	import { untrack } from 'svelte'
	import api, { StoreClosureError } from '$lib/api'
	import {
		EMAIL_SUFFIX,
		type CartItem,
		type Coupon,
		applyCoupon,
		calculateCartTotal,
		checkRequirement,
		formatPrice
	} from '$lib/cart'
	import { pluralise } from '$lib/util'
	import Button from '$lib/ui/Button.svelte'
	import EmptyState from '$lib/ui/EmptyState.svelte'
	import ErrorBoundary from '$lib/ui/ErrorBoundary.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import SectionMessage from '$lib/ui/SectionMessage.svelte'
	import TextField from '$lib/ui/TextField.svelte'
	import Invoice from '$lib/Invoice.svelte'

	interface Props {
		cart: CartItem[]
		availableCoupons: Coupon[]
		// Present when the cart is shown as a closable panel (small screens).
		onClose?: () => void
		// The heading element, so the parent can move focus into the panel.
		heading?: HTMLElement
	}
	let { cart = $bindable(), availableCoupons, onClose, heading = $bindable() }: Props = $props()

	let headingEl: HTMLElement | undefined = $state()
	$effect(() => {
		heading = headingEl
	})

	const itemCount = $derived(cart.reduce((acc, x) => acc + x.amount, 0))

	// ---- Buyer details ------------------------------------------------------
	let name = $state('')
	let matric = $state('')
	let email = $state('')
	const touched = $state({ name: false, matric: false, email: false })
	let submitted = $state(false)

	const validateName = (v: string) => v.trim() !== ''
	const validateMatric = (v: string) => /^[UG]\d{7}[A-Z]$/.test(v)
	const validateEmail = (v: string) => /^[A-Za-z0-9]+$/.test(v)

	const nameError = $derived(validateName(name) ? undefined : 'Enter your name.')
	const matricError = $derived(
		validateMatric(matric)
			? undefined
			: matric === ''
				? 'Enter your matric number.'
				: 'Use the format U1234567A.'
	)
	const emailError = $derived(
		validateEmail(email)
			? undefined
			: email === ''
				? 'Enter your NTU email.'
				: 'Enter only the part before @e.ntu.edu.sg, using letters and numbers.'
	)
	// Errors appear once a field has been left (or after a submit attempt).
	const shown = (field: keyof typeof touched, error?: string) =>
		touched[field] || submitted ? error : undefined

	// ---- Coupon -------------------------------------------------------------
	let couponCode = $state('')
	let coupon: Coupon | undefined = $state.raw()
	// `auto` coupons are the best public coupon; `manual` ones were typed in.
	let couponSource: 'auto' | 'manual' | undefined = $state()
	let couponError: string | undefined = $state()
	let couponInfo: string | undefined = $state()
	let couponChecking = $state(false)

	const qualifies = (c: Coupon) => c.requirements.every((r) => checkRequirement(cart, email, r))
	const findBestCoupon = () =>
		availableCoupons.reduce<Coupon | null>((prev, candidate) => {
			// Choose the better coupon (prev).
			if (prev && applyCoupon(cart, prev) < applyCoupon(cart, candidate)) return prev
			// Use the candidate if we can.
			if (qualifies(candidate)) return candidate
			// Otherwise, use whatever we had previously.
			return prev
		}, null)
	const requirementMessage = (c: Coupon) => {
		const failing = c.requirements.filter((r) => !checkRequirement(cart, email, r))
		const parts = failing.map((r) => {
			switch (r.type) {
				case 'purchase_count':
					return `needs ${r.amount}+ ${r.amount === 1 ? 'item' : 'items'} in the cart (you have ${itemCount})`
				case 'email':
					return 'is only valid for one specific NTU email'
			}
		})
		return `${c.couponCode} ${parts.join(' and ')}.`
	}

	// Keeps the applied coupon in step with the cart and email: auto-apply the
	// best public coupon unless the buyer entered their own code.
	const syncCoupon = (best: Coupon | null) => {
		if (couponSource === 'manual') {
			if (coupon) couponError = qualifies(coupon) ? undefined : requirementMessage(coupon)
			return
		}
		if (best) {
			if (coupon !== best) {
				coupon = best
				couponSource = 'auto'
				couponCode = best.couponCode
				couponError = undefined
				couponInfo = undefined
			}
		} else if (couponSource === 'auto') {
			couponInfo = `${coupon?.couponCode} no longer applies to your cart.`
			coupon = undefined
			couponSource = undefined
			couponCode = ''
		}
	}
	$effect(() => {
		// Track the inputs explicitly: findBestCoupon only reads what it needs.
		void email
		for (const item of cart) void item.amount
		const best = findBestCoupon()
		untrack(() => syncCoupon(best))
	})

	const applyCode = async () => {
		const code = couponCode.trim()
		couponError = undefined
		couponInfo = undefined
		if (!code) {
			removeCoupon()
			return
		}
		couponChecking = true
		try {
			let candidate = availableCoupons.find(
				(x) => x.couponCode.toLowerCase() === code.toLowerCase()
			)
			if (!candidate) candidate = await api.sales().couponByCode(code)
			couponSource = 'manual'
			if (!qualifies(candidate)) {
				coupon = undefined
				couponError = requirementMessage(candidate)
				return
			}
			coupon = candidate
			couponCode = candidate.couponCode
		} catch {
			couponSource = 'manual'
			coupon = undefined
			couponError = `We couldn't find a coupon with the code ${code}.`
		} finally {
			couponChecking = false
		}
	}
	const removeCoupon = () => {
		coupon = undefined
		couponSource = undefined
		couponCode = ''
		couponError = undefined
		couponInfo = undefined
		syncCoupon(findBestCoupon())
	}
	// A typed code that has not been applied yet.
	const couponPending = $derived(
		couponCode.trim() !== '' &&
			(!coupon || coupon.couponCode.toLowerCase() !== couponCode.trim().toLowerCase())
	)

	const couponMessage = $derived(
		coupon
			? `${coupon.couponCode} applied: ${coupon.discount.amount}% off${couponSource === 'auto' ? ' (applied automatically)' : ''}.`
			: ''
	)

	// ---- Totals & checkout --------------------------------------------------
	const subtotal = $derived(calculateCartTotal(cart))
	const total = $derived(coupon ? Math.min(applyCoupon(cart, coupon), subtotal) : subtotal)

	const invalidCount = $derived(
		[nameError, matricError, emailError, couponError].filter(Boolean).length
	)
	let checkingOut = $state(false)
	let checkoutError: unknown = $state()
	let storeClosed = $state(false)

	const checkout = async () => {
		submitted = true
		checkoutError = undefined
		if (couponPending) await applyCode()
		const firstInvalid = nameError
			? 'checkout-name'
			: matricError
				? 'checkout-matric'
				: emailError
					? 'checkout-email'
					: couponError
						? 'checkout-coupon'
						: undefined
		if (firstInvalid) {
			document.getElementById(firstInvalid)?.focus()
			return
		}
		checkingOut = true
		try {
			const checkoutURL = await api.orders.checkout(
				cart,
				name.trim(),
				matric,
				email + EMAIL_SUFFIX,
				coupon?.couponCode
			)
			window.location.href = checkoutURL
		} catch (e) {
			checkingOut = false
			if (e instanceof StoreClosureError) storeClosed = true
			else checkoutError = e
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center justify-between gap-2">
		<h2 class="text-h3 outline-none" tabindex="-1" bind:this={headingEl}>
			Cart
			<span class="font-normal text-ink-subtle">({pluralise(itemCount, 'item')})</span>
		</h2>
		{#if onClose}
			<Button appearance="subtle" iconOnly label="Close cart" onClick={onClose}>
				<Icon name="x" class="size-5" />
			</Button>
		{/if}
	</div>

	{#if cart.length === 0}
		<EmptyState
			compact
			icon="cart"
			title="Your cart is empty"
			description="Add some merch to check out."
		>
			{#if onClose}<Button onClick={onClose}>Browse merch</Button>{/if}
		</EmptyState>
	{:else}
		<Invoice bind:items={cart} {coupon} editable />

		<form
			class="flex flex-col gap-4 border-t-2 border-line pt-4"
			novalidate
			onsubmit={(e) => {
				e.preventDefault()
				checkout()
			}}
		>
			<div>
				<h3 class="text-h4">Your details</h3>
				<p class="text-small text-ink-subtlest">Required fields are marked with an asterisk *</p>
			</div>
			<TextField
				id="checkout-name"
				label="Name"
				bind:value={name}
				autocomplete="name"
				required
				error={shown('name', nameError)}
				onblur={() => (touched.name = true)}
			/>
			<TextField
				id="checkout-matric"
				label="Matric number"
				bind:value={matric}
				helper="Format: U1234567A"
				autocapitalize="characters"
				autocomplete="off"
				spellcheck={false}
				maxlength={9}
				required
				error={shown('matric', matricError)}
				oninput={() => (matric = matric.toUpperCase())}
				onblur={() => (touched.matric = true)}
			/>
			<TextField
				id="checkout-email"
				label="NTU email"
				bind:value={email}
				helper="Enter only the part before @e.ntu.edu.sg"
				autocapitalize="none"
				autocomplete="username"
				spellcheck={false}
				required
				error={shown('email', emailError)}
				onblur={() => (touched.email = true)}
			>
				{#snippet elemAfter()}<span class="select-none">{EMAIL_SUFFIX}</span>{/snippet}
			</TextField>

			<div class="flex flex-col gap-2">
				<TextField
					id="checkout-coupon"
					label="Coupon code"
					bind:value={couponCode}
					autocapitalize="characters"
					autocomplete="off"
					spellcheck={false}
					error={couponError}
					oninput={() => (couponError = undefined)}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault()
							applyCode()
						}
					}}
				>
					{#snippet elemAfter()}
						<Button
							appearance="subtle"
							spacing="compact"
							onClick={applyCode}
							loading={couponChecking}
						>
							Apply
						</Button>
					{/snippet}
				</TextField>
				{#if coupon && !couponError && !couponPending}
					<p class="ds-message text-success-text" role="status">
						<Icon name="check-circle" class="size-4" />
						<span>
							{couponMessage}
							{#if couponSource === 'manual'}
								<button type="button" class="ds-link" onclick={removeCoupon}>Remove</button>
							{/if}
						</span>
					</p>
				{:else if couponInfo}
					<p class="ds-message" role="status">
						<Icon name="information-circle" class="size-4" />
						<span>{couponInfo}</span>
					</p>
				{/if}
			</div>

			{#if submitted && invalidCount > 0}
				<SectionMessage appearance="error">
					Fix {pluralise(invalidCount, 'field')} above to continue.
				</SectionMessage>
			{/if}
			{#if storeClosed}
				<SectionMessage appearance="warning" title="The store has just closed">
					You have not been charged. <a href="/wait" class="ds-link">See when it reopens</a>.
				</SectionMessage>
			{/if}
			<ErrorBoundary error={checkoutError} title="Checkout failed" />

			<Button appearance="primary" type="submit" fullWidth loading={checkingOut}>
				{#snippet iconBefore()}<Icon name="lock-closed" class="size-4" />{/snippet}
				Checkout · S$ {formatPrice(total / 100)}
			</Button>
			<p class="text-center text-small text-ink-subtlest" aria-live="polite">
				{#if checkingOut}
					Redirecting you to Stripe…
				{:else}
					You'll pay by card on Stripe's secure page. Your order ID and collection details will be
					emailed to your NTU email.
				{/if}
			</p>
		</form>
	{/if}
</div>
