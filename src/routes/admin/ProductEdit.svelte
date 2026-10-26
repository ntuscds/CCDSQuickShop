<script lang="ts">
	import type { ShopItem } from '$lib/shop'
	import Button from '$lib/ui/Button.svelte'
	import Card from '$lib/ui/Card.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import MoneyField from '$lib/ui/MoneyField.svelte'
	import Select from '$lib/ui/Select.svelte'
	import TextField from '$lib/ui/TextField.svelte'
	import Toggle from '$lib/ui/Toggle.svelte'
	import ImageUpload from './ImageUpload.svelte'

	interface Props {
		product: ShopItem
	}
	let { product = $bindable() }: Props = $props()

	const addVariant = () => {
		product.variants.push({
			type: '',
			options: [
				// Automatically create blanks for the admin to fill in.
				{ text: '', additionalPrice: 0 },
				{ text: '', additionalPrice: 0 }
			]
		})
	}
	const removeVariant = (i: number) => () => {
		product.variants.splice(i, 1)
	}
	const addVariantOption = (i: number) => () => {
		product.variants[i].options.push({ text: '', additionalPrice: 0 })
	}
	const removeVariantOption = (i: number, j: number) => () => {
		product.variants[i].options.splice(j, 1)
	}
	const addImageRule = () => {
		product.imageURLs.push({ selectedOptions: [], url: '' })
	}
	const removeImageRule = (i: number) => () => {
		product.imageURLs.splice(i, 1)
	}
</script>

<Card title="Details">
	<div class="flex flex-col gap-4">
		<TextField label="Name" bind:value={product.name} required placeholder="e.g. SCDS Hoodie" />
		<MoneyField
			label="Base price"
			bind:value={product.basePrice}
			helper="Options can add to this price below."
		/>
		<Toggle label="Visible in store" bind:checked={product.enabled} />
		<p class="-mt-2 text-small text-ink-subtlest">Hidden products are kept but cannot be bought.</p>
		<ImageUpload label="Default image" bind:value={product.defaultImageURL} />
		{#if product.id}
			<p class="text-small text-ink-subtlest">
				Product ID {product.id} · Sale period {product.salePeriod}
			</p>
		{/if}
	</div>
</Card>

<Card
	title="Options"
	description="Each option group (e.g. Colour, Size) must be chosen by the buyer."
>
	<div class="flex flex-col gap-4">
		{#each product.variants as variant, i}
			<div class="rounded-ds border border-line p-4">
				<div class="flex flex-col gap-4">
					<div class="flex items-end gap-2">
						<TextField
							label="Option group name"
							bind:value={product.variants[i].type}
							placeholder="e.g. Size"
							required
							class="flex-1"
						/>
						<Button appearance="subtle" onClick={removeVariant(i)}>
							{#snippet iconBefore()}<Icon name="trash" class="size-4" />{/snippet}
							Remove group
						</Button>
					</div>
					<ImageUpload
						label="Size chart image (optional)"
						bind:value={() => product.variants[i].chart_url ?? '',
						(v) => (product.variants[i].chart_url = v || undefined)}
						raw
						helper="Shown to buyers as a link next to this option group."
					/>
					<div class="flex flex-col gap-2">
						<p class="ds-label">Choices</p>
						{#each variant.options as option, j}
							<div class="flex items-end gap-2">
								<TextField
									label="Choice"
									hideLabel
									bind:value={product.variants[i].options[j].text}
									placeholder="e.g. M"
									compact
									class="flex-1"
								/>
								<MoneyField
									label="Extra price"
									hideLabel
									bind:value={() => product.variants[i].options[j].additionalPrice ?? 0,
									(v) => (product.variants[i].options[j].additionalPrice = v)}
									compact
									allowNegative
									class="w-36"
								/>
								<Button
									appearance="subtle"
									iconOnly
									label={`Remove choice ${option.text || j + 1}`}
									onClick={removeVariantOption(i, j)}
								>
									<Icon name="trash" class="size-4" />
								</Button>
							</div>
						{/each}
						<div>
							<Button spacing="compact" onClick={addVariantOption(i)}>
								{#snippet iconBefore()}<Icon name="plus" class="size-4" />{/snippet}
								Add choice
							</Button>
						</div>
					</div>
				</div>
			</div>
		{/each}
		<div>
			<Button onClick={addVariant}>
				{#snippet iconBefore()}<Icon name="plus" class="size-4" />{/snippet}
				Add option group
			</Button>
		</div>
	</div>
</Card>

<Card
	title="Images per option"
	description="Show a different image depending on the chosen options. The most specific rule wins; the default image is used otherwise."
>
	<div class="flex flex-col gap-4">
		{#each product.imageURLs as rule, i}
			<div class="rounded-ds border border-line p-4">
				<div class="flex flex-col gap-3">
					<div class="flex flex-wrap items-end gap-2">
						<span class="pb-2 text-ink-subtle">
							{rule.url ? 'Use for' : 'Image rule'}
						</span>
						{#each product.variants as variant, j}
							<Select
								label={variant.type || `Option group ${j + 1}`}
								bind:value={product.imageURLs[i].selectedOptions[j]}
								compact
								class="w-40"
							>
								<option value={null}>Any {variant.type.toLowerCase()}</option>
								{#each variant.options as option}
									<option value={option.text}>{option.text}</option>
								{/each}
							</Select>
						{/each}
						<div class="ml-auto">
							<Button appearance="subtle" onClick={removeImageRule(i)}>
								{#snippet iconBefore()}<Icon name="trash" class="size-4" />{/snippet}
								Remove
							</Button>
						</div>
					</div>
					<ImageUpload label="Image" bind:value={product.imageURLs[i].url} />
				</div>
			</div>
		{/each}
		<div>
			<Button onClick={addImageRule}>
				{#snippet iconBefore()}<Icon name="plus" class="size-4" />{/snippet}
				Add image rule
			</Button>
		</div>
	</div>
</Card>
