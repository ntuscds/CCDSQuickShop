<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/state'
	import api, { type Order } from '$lib/api'
	import { normaliseOrderQuery, pluralise, sortOrder } from '$lib/util'
	import Button from '$lib/ui/Button.svelte'
	import Checkbox from '$lib/ui/Checkbox.svelte'
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte'
	import EmptyState from '$lib/ui/EmptyState.svelte'
	import ErrorBoundary from '$lib/ui/ErrorBoundary.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import PageHeader from '$lib/ui/PageHeader.svelte'
	import TextField from '$lib/ui/TextField.svelte'
	import { addFlag } from '$lib/ui/flags.svelte'
	import OrderPreview from '../orders/[id]/OrderPreview.svelte'

	let query = $state('')
	let includeCancelled = $state(false)
	let orders: Order[] = $state([])
	// The keyword of the last completed search.
	let searched: string | undefined = $state()
	let loading = $state(false)
	let error: unknown = $state()
	let field: TextField | undefined = $state()

	const HISTORY_KEY = 'adminSearchHistory'
	let pastSearches: string[] = $state([])
	onMount(() => {
		try {
			pastSearches = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]')
		} catch {
			pastSearches = []
		}
		const q = page.url.searchParams.get('q')
		if (q) search(q)
		else field?.focus()
	})

	const remember = (keyword: string) => {
		pastSearches = [keyword, ...pastSearches.filter((x) => x !== keyword)].slice(0, 5)
		window.localStorage.setItem(HISTORY_KEY, JSON.stringify(pastSearches))
	}
	const search = async (keyword = query) => {
		const q = normaliseOrderQuery(keyword)
		if (!q) {
			field?.focus()
			return
		}
		query = q
		loading = true
		error = undefined
		try {
			remember(q)
			orders = sortOrder(await api.admin.orders.search(q, includeCancelled))
			searched = q
		} catch (e) {
			error = e
		} finally {
			loading = false
		}
	}

	let collecting: Order | undefined = $state()
	let collectOpen = $state(false)
	const collect = async () => {
		if (!collecting) return
		const order = collecting
		await api.admin.orders.collect(order.id)
		orders = orders.map((x) => ({
			...x,
			collectionTime: x.id === order.id ? new Date() : x.collectionTime
		}))
		addFlag({
			appearance: 'success',
			title: `Order ${order.id} collected`,
			description: `${order.name} · ${order.matricNumber}`
		})
		// Ready for the next person in the queue (after the dialog has closed and
		// restored focus).
		query = ''
		setTimeout(() => field?.focus())
	}

	let cancelling: Order | undefined = $state()
	let cancelOpen = $state(false)
	const cancel = async () => {
		if (!cancelling) return
		const order = cancelling
		await api.admin.orders.cancel(order.id)
		orders = orders.map((x) => ({ ...x, cancelled: x.id === order.id ? true : x.cancelled }))
		addFlag({ appearance: 'information', title: `Order ${order.id} cancelled` })
	}

	const itemCount = (order?: Order) => order?.items.reduce((acc, x) => acc + x.amount, 0) ?? 0
</script>

<svelte:head><title>Collect orders - Admin</title></svelte:head>

<PageHeader
	title="Collect orders"
	description="Search by matric number, order ID or NTU email, then mark the order as collected when the merch is handed over."
/>

<form
	class="flex flex-col gap-3"
	onsubmit={(e) => {
		e.preventDefault()
		search()
	}}
>
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
		<TextField
			label="Matric number, order ID or email"
			bind:value={query}
			autocapitalize="characters"
			autocomplete="off"
			spellcheck={false}
			enterkeyhint="search"
			placeholder="U1234567A"
			class="flex-1"
			bind:this={field}
		/>
		<Button appearance="primary" type="submit" {loading}>
			{#snippet iconBefore()}<Icon name="magnifying-glass" class="size-4" />{/snippet}
			Search
		</Button>
	</div>
	<div class="flex flex-wrap items-center gap-x-6 gap-y-2">
		<Checkbox label="Include cancelled orders" bind:checked={includeCancelled} />
		{#if pastSearches.length > 0}
			<div class="flex flex-wrap items-center gap-1 text-small text-ink-subtle">
				<span>Recent:</span>
				{#each pastSearches as keyword (keyword)}
					<button
						type="button"
						class="max-w-56 truncate rounded-ds bg-na-200 px-2 py-0.5 text-small text-ink hover:bg-na-300"
						onclick={() => search(keyword)}
					>
						{keyword}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</form>

<ErrorBoundary {error} />

{#if searched !== undefined && orders.length === 0 && !loading}
	<EmptyState
		icon="magnifying-glass"
		title={`No orders matched "${searched}"`}
		description="Check the matric number or order ID, or include cancelled orders."
	/>
{:else if orders.length > 0}
	<p class="text-ink-subtle" role="status">
		{pluralise(orders.length, 'order')} for "{searched}"
	</p>
	<div class="flex flex-col gap-3">
		{#each orders as order (order.id)}
			<OrderPreview
				{order}
				expanded
				onCollect={() => {
					collecting = order
					collectOpen = true
				}}
				onCancel={() => {
					cancelling = order
					cancelOpen = true
				}}
			/>
		{/each}
	</div>
{/if}

<ConfirmDialog
	bind:open={collectOpen}
	title="Mark as collected?"
	message={`Hand over ${pluralise(itemCount(collecting), 'item')} to ${collecting?.name ?? ''} (${collecting?.matricNumber ?? ''}) for order ${collecting?.id ?? ''}. This cannot be undone.`}
	confirmLabel="Mark as collected"
	appearance="primary"
	onConfirm={collect}
/>
<ConfirmDialog
	bind:open={cancelOpen}
	title="Cancel this order?"
	message={`Order ${cancelling?.id ?? ''} for ${cancelling?.name ?? ''} will be cancelled and its payment session closed. This cannot be undone.`}
	confirmLabel="Cancel order"
	cancelLabel="Keep order"
	onConfirm={cancel}
/>
