<script lang="ts">
	import { type CartItem, type OrderItem, formatPrice } from '$lib/cart'
	import Button from '$lib/ui/Button.svelte'
	import Dialog from '$lib/ui/Dialog.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import QuantityStepper from '$lib/ui/QuantityStepper.svelte'

	interface Props {
		item: CartItem | OrderItem
		editable?: boolean
		onRemove?: () => void
	}
	let { item = $bindable(), editable = false, onRemove }: Props = $props()

	const itemVariant = $derived(
		typeof item.variant === 'string' ? item.variant : item.variant.map((x) => x.option).join(', ')
	)
	let zoomOpen = $state(false)
</script>

<div class="flex items-start gap-3 py-3">
	<button
		type="button"
		class="shrink-0 cursor-zoom-in overflow-hidden rounded-ds bg-surface-sunken"
		onclick={() => (zoomOpen = true)}
		aria-label={`Enlarge image of ${item.name}`}
	>
		<img src={item.imageURL} alt="" class="size-16 object-cover" loading="lazy" />
	</button>
	<div class="flex min-w-0 flex-1 flex-col gap-1">
		<p class="font-medium [overflow-wrap:anywhere]">{item.name}</p>
		{#if itemVariant}<p class="text-small text-ink-subtle">{itemVariant}</p>{/if}
		<div class="mt-1 flex flex-wrap items-center justify-between gap-2">
			<div class="flex items-center gap-1">
				{#if editable}
					<QuantityStepper bind:value={item.amount} label={`${item.name} ${itemVariant}`} compact />
					{#if onRemove}
						<Button
							appearance="subtle"
							spacing="compact"
							iconOnly
							label={`Remove ${item.name} ${itemVariant} from cart`}
							onClick={onRemove}
						>
							<Icon name="trash" class="size-4" />
						</Button>
					{/if}
				{:else}
					<span class="text-ink-subtle">Qty {item.amount}</span>
				{/if}
			</div>
			<p class="tabular-nums">S$ {formatPrice((item.amount * item.unitPrice) / 100)}</p>
		</div>
	</div>
</div>

<Dialog bind:open={zoomOpen} plain width="large">
	<div class="relative">
		<img
			src={item.imageURL}
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
