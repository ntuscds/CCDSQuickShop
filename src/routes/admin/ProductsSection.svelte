<script lang="ts">
	import { onMount } from 'svelte'
	import api from '$lib/api'
	import { formatPrice } from '$lib/cart'
	import { emptyShopItem, type ShopItem } from '$lib/shop'
	import { pluralise } from '$lib/util'
	import Button from '$lib/ui/Button.svelte'
	import EmptyState from '$lib/ui/EmptyState.svelte'
	import ErrorBoundary from '$lib/ui/ErrorBoundary.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import Lozenge from '$lib/ui/Lozenge.svelte'
	import PageHeader from '$lib/ui/PageHeader.svelte'
	import Spinner from '$lib/ui/Spinner.svelte'
	import { addFlag } from '$lib/ui/flags.svelte'
	import EditorFrame from './EditorFrame.svelte'
	import ProductEdit from './ProductEdit.svelte'

	interface Props {
		salePeriod: string
	}
	const { salePeriod }: Props = $props()

	let items: ShopItem[] = $state([])
	let loading = $state(true)
	let error: unknown = $state()
	const load = async () => {
		loading = true
		error = undefined
		try {
			items = await api.admin.sales(salePeriod).products()
		} catch (e) {
			error = e
		} finally {
			loading = false
		}
	}
	onMount(load)

	// The product being edited is a copy, so Cancel discards changes.
	let editing: ShopItem | undefined = $state()
	let original = $state('')
	const dirty = $derived(!!editing && JSON.stringify(editing) !== original)
	const edit = (item: ShopItem) => {
		editing = $state.snapshot(item)
		original = JSON.stringify(editing)
		saveError = undefined
	}
	const create = () => edit(emptyShopItem('', salePeriod))

	let saving = $state(false)
	let saveError: unknown = $state()
	const save = async () => {
		if (!editing) return
		saving = true
		saveError = undefined
		try {
			const saved = await api.admin.sales(salePeriod).updateProduct($state.snapshot(editing))
			const idx = items.findIndex((x) => x.id === saved.id)
			if (idx >= 0) items[idx] = saved
			else items = [...items, saved]
			addFlag({ appearance: 'success', title: 'Product saved', description: saved.name })
			editing = undefined
		} catch (e) {
			saveError = e
		} finally {
			saving = false
		}
	}

	const optionSummary = (item: ShopItem) =>
		item.variants
			.map((v) => pluralise(v.options.length, (v.type || 'option').toLowerCase()))
			.join(' · ')
</script>

<svelte:head><title>Products - Admin</title></svelte:head>

{#if editing}
	<EditorFrame
		listLabel="Products"
		title={editing.id ? editing.name || 'Edit product' : 'New product'}
		{dirty}
		{saving}
		error={saveError}
		saveLabel={editing.id ? 'Save product' : 'Create product'}
		onSave={save}
		onCancel={() => (editing = undefined)}
	>
		<ProductEdit bind:product={editing} />
	</EditorFrame>
{:else}
	<PageHeader title="Products" description="Merch on sale in the selected sale period.">
		{#snippet actions()}
			<Button appearance="primary" onClick={create}>
				{#snippet iconBefore()}<Icon name="plus" class="size-4" />{/snippet}
				Add product
			</Button>
		{/snippet}
	</PageHeader>
	<ErrorBoundary {error}>
		{#if loading}
			<div class="flex justify-center py-12"><Spinner size="large" /></div>
		{:else if items.length === 0}
			<EmptyState
				icon="cube"
				title="No products yet"
				description="Add the first product for this sale period."
			>
				<Button appearance="primary" onClick={create}>Add product</Button>
			</EmptyState>
		{:else}
			<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Products">
				{#each items as item (item.id)}
					<li
						class="flex overflow-hidden rounded-ds-lg border border-line bg-surface-raised shadow-raised"
					>
						<div class="size-32 shrink-0 bg-surface-sunken">
							{#if item.defaultImageURL}
								<img
									src={item.defaultImageURL}
									alt=""
									class="size-full object-cover"
									loading="lazy"
								/>
							{/if}
						</div>
						<div class="flex min-w-0 flex-1 flex-col gap-1 p-3">
							<div class="flex flex-wrap items-center gap-2">
								<p class="text-h5 [overflow-wrap:anywhere]">{item.name || '(untitled)'}</p>
								{#if item.enabled}
									<Lozenge appearance="success">Live</Lozenge>
								{:else}
									<Lozenge>Hidden</Lozenge>
								{/if}
							</div>
							<p class="tabular-nums">S$ {formatPrice(item.basePrice / 100)}</p>
							<p class="text-small text-ink-subtlest">{optionSummary(item) || 'No options'}</p>
							<div class="mt-auto pt-2">
								<Button spacing="compact" onClick={() => edit(item)}>
									{#snippet iconBefore()}<Icon name="pencil-square" class="size-4" />{/snippet}
									Edit
								</Button>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</ErrorBoundary>
{/if}
