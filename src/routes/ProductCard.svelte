<script lang="ts">
	import { slide } from 'svelte/transition'
	import { prefersReducedMotion } from 'svelte/motion'
	import { formatPrice, type CartItem } from '$lib/cart'
	import { resolveImageURL, tentativePrice, toArrayVariant, type ShopItem } from '$lib/shop'
	import { pluralise } from '$lib/util'
	import Button from '$lib/ui/Button.svelte'
	import ChoiceChips from '$lib/ui/ChoiceChips.svelte'
	import Dialog from '$lib/ui/Dialog.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import Lozenge from '$lib/ui/Lozenge.svelte'
	import { uid } from '$lib/ui/uid'

	interface Props {
		item: ShopItem
		expanded: boolean
		onToggle: () => void
		inCartCount: number
		onAdd: (item: CartItem) => void
	}
	const { item, expanded, onToggle, inCartCount, onAdd }: Props = $props()

	// Options the buyer has committed to, keyed by variant type.
	const chosen: Record<string, string | undefined> = $state({})
	// Option being hovered or focused (falls back to the chosen one), used to
	// preview the image and price before committing.
	const preview: Record<string, string | undefined> = $state({})
	const setPreview = (type: string) => (value?: string) => {
		preview[type] = value
	}

	const previewPrice = $derived(tentativePrice(item, preview))
	const previewImage = $derived(resolveImageURL(item, preview))
	const cardImage = $derived(resolveImageURL(item, chosen))

	const hasAddons = $derived(
		item.variants.some((v) => v.options.some((o) => (o.additionalPrice ?? 0) !== 0))
	)
	const optionSummary = $derived(
		item.variants.map((v) => pluralise(v.options.length, v.type.toLowerCase())).join(' · ')
	)
	const arrayVariant = $derived(toArrayVariant(item, chosen))
	const complete = $derived(arrayVariant.every((x) => !!x))
	const chosenSummary = $derived(arrayVariant.filter((x) => !!x).join(', '))

	// Price deltas are shown relative to the base price so they stay stable.
	const delta = (additional?: number) => {
		if (!additional) return undefined
		const sign = additional > 0 ? '+' : '−'
		return `${sign}S$ ${formatPrice(Math.abs(additional) / 100)}`
	}
	const choicesFor = (variant: ShopItem['variants'][number]) =>
		variant.options.map((o) => ({
			value: o.text,
			label: o.text,
			description: delta(o.additionalPrice)
		}))

	// Variant type the buyer still needs to choose, shown after a failed add.
	let missing: string | undefined = $state()
	const chips: Record<string, ChoiceChips> = {}
	$effect(() => {
		if (missing && chosen[missing]) missing = undefined
	})
	const add = () => {
		if (!complete) {
			const idx = arrayVariant.findIndex((x) => !x)
			missing = item.variants[idx].type
			chips[missing]?.focus()
			return
		}
		missing = undefined
		onAdd({
			id: item.id,
			name: item.name,
			variant: arrayVariant.map((x, i) => ({ type: item.variants[i].type, option: x! })),
			imageURL: resolveImageURL(item, chosen),
			unitPrice: tentativePrice(item, chosen),
			amount: 1
		})
	}

	let chart: { title: string; url: string } | undefined = $state()
	let zoomOpen = $state(false)
	const bodyId = uid('product-options')
	const duration = $derived(prefersReducedMotion.current ? 0 : 200)
</script>

<article class="ds-product" class:expanded>
	<button
		type="button"
		class="ds-product-header"
		aria-expanded={expanded}
		aria-controls={bodyId}
		onclick={onToggle}
	>
		{#if !expanded}
			<span class="block aspect-square w-full bg-surface-sunken">
				<img src={cardImage} alt="" class="size-full object-cover" loading="lazy" />
			</span>
		{/if}
		<span class="flex w-full flex-col gap-2 p-4">
			<span class="min-w-0">
				<span class="block text-h4 [overflow-wrap:anywhere]">{item.name}</span>
				{#if !expanded}
					<span class="mt-1 block tabular-nums">
						{#if hasAddons}From{/if}
						S$ {formatPrice(item.basePrice / 100)}
					</span>
					{#if optionSummary}
						<span class="mt-1 block text-small text-ink-subtlest">{optionSummary}</span>
					{/if}
				{/if}
			</span>
			<span class="flex w-full flex-wrap items-center justify-between gap-2">
				<span class="flex min-w-0 flex-wrap gap-1">
					{#if inCartCount > 0}<Lozenge appearance="success">In cart ×{inCartCount}</Lozenge>{/if}
					{#if chosenSummary && !expanded}<Lozenge>{chosenSummary}</Lozenge>{/if}
				</span>
				<span class="ml-auto flex shrink-0 items-center gap-1 text-small font-medium text-brand">
					{expanded ? 'Hide options' : 'Choose options'}
					<Icon name={expanded ? 'chevron-up' : 'chevron-down'} class="size-4" />
				</span>
			</span>
		</span>
	</button>

	{#if expanded}
		<div
			id={bodyId}
			class="grid gap-6 border-t border-line p-4 md:grid-cols-[minmax(0,320px),minmax(0,1fr)]"
			transition:slide={{ duration }}
		>
			<div>
				<button
					type="button"
					class="block w-full cursor-zoom-in overflow-hidden rounded-ds-lg bg-surface-sunken"
					onclick={() => (zoomOpen = true)}
					aria-label={`Enlarge image of ${item.name}`}
				>
					<img src={previewImage} alt="" class="aspect-square w-full object-contain" />
				</button>
			</div>

			<div class="flex flex-col gap-5">
				<div>
					<p class="text-h2 tabular-nums">S$ {formatPrice(previewPrice / 100)}</p>
					{#if hasAddons}
						<p class="mt-1 text-small text-ink-subtlest">
							The price updates with the options you choose.
						</p>
					{/if}
				</div>

				{#each item.variants as variant (variant.type)}
					{@const errorId = `${bodyId}-${variant.type}-error`}
					<div class="flex flex-col gap-2">
						<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
							<span class="ds-label">{variant.type}</span>
							{#if variant.chart_url}
								<Button
									appearance="link"
									onClick={() =>
										(chart = { title: `${variant.type} chart`, url: variant.chart_url! })}
								>
									{#snippet iconBefore()}<Icon name="photo" class="size-4" />{/snippet}
									{variant.type} chart
								</Button>
							{/if}
						</div>
						<ChoiceChips
							label={variant.type}
							options={choicesFor(variant)}
							bind:value={chosen[variant.type]}
							onPreview={setPreview(variant.type)}
							describedBy={missing === variant.type ? errorId : undefined}
							bind:this={chips[variant.type]}
						/>
						{#if missing === variant.type}
							<p id={errorId} class="ds-message is-error" role="alert">
								<Icon name="exclamation-circle" class="size-4" />
								<span>Choose a {variant.type.toLowerCase()} to continue.</span>
							</p>
						{/if}
					</div>
				{/each}

				<div class="flex flex-wrap items-center gap-3">
					<Button appearance="primary" onClick={add}>
						{#snippet iconBefore()}<Icon name="cart" class="size-4" />{/snippet}
						Add to cart
					</Button>
					{#if inCartCount > 0}
						<span class="text-ink-subtle">In cart: {inCartCount}</span>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</article>

<Dialog open={!!chart} title={chart?.title} width="large" onclose={() => (chart = undefined)}>
	{#if chart}
		<img
			src={chart.url}
			alt={`${chart.title} for ${item.name}`}
			class="mx-auto mb-4 max-h-[70vh]"
		/>
	{/if}
</Dialog>

<Dialog bind:open={zoomOpen} plain width="xlarge">
	<div class="relative">
		<img
			src={previewImage}
			alt={`Picture of ${item.name}`}
			class="max-h-[85vh] w-full object-contain"
		/>
		<div class="absolute right-2 top-2">
			<Button appearance="default" iconOnly label="Close" onClick={() => (zoomOpen = false)}>
				<Icon name="x" class="size-5" />
			</Button>
		</div>
	</div>
</Dialog>

<style lang="postcss">
	.ds-product {
		@apply overflow-hidden rounded-ds-lg border border-line bg-surface-raised shadow-raised transition-shadow;
	}
	.ds-product:hover {
		@apply shadow-overlay;
	}
	.ds-product.expanded {
		@apply border-brand;
	}
	.ds-product-header {
		@apply flex w-full flex-col text-left;
	}
	.ds-product-header:focus-visible {
		outline-offset: -2px;
	}
</style>
