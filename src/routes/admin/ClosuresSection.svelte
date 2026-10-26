<script lang="ts">
	import { onMount } from 'svelte'
	import api, { type StoreClosure } from '$lib/api'
	import { formatDate, formatFriendlyDate } from '$lib/util'
	import Button from '$lib/ui/Button.svelte'
	import Card from '$lib/ui/Card.svelte'
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte'
	import EmptyState from '$lib/ui/EmptyState.svelte'
	import ErrorBoundary from '$lib/ui/ErrorBoundary.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import Lozenge from '$lib/ui/Lozenge.svelte'
	import PageHeader from '$lib/ui/PageHeader.svelte'
	import Spinner from '$lib/ui/Spinner.svelte'
	import TextField from '$lib/ui/TextField.svelte'
	import Toggle from '$lib/ui/Toggle.svelte'
	import { addFlag } from '$lib/ui/flags.svelte'
	import EditorFrame from './EditorFrame.svelte'

	let closures: StoreClosure[] = $state([])
	let loading = $state(true)
	let error: unknown = $state()
	const load = async () => {
		loading = true
		error = undefined
		try {
			closures = await api.admin.closures.list()
		} catch (e) {
			error = e
		} finally {
			loading = false
		}
	}
	onMount(load)

	const statusOf = (closure: StoreClosure): 'active' | 'scheduled' | 'ended' => {
		const now = Date.now()
		if (closure.end_time.getTime() < now) return 'ended'
		if (closure.start_time.getTime() > now) return 'scheduled'
		return 'active'
	}
	const sorted = $derived(
		[...closures].sort((a, b) => b.start_time.getTime() - a.start_time.getTime())
	)

	// The editor works on local date strings for the datetime inputs.
	interface Draft {
		id: string
		start: string
		end: string
		message: string
		show_order_check: boolean
	}
	let editing: Draft | undefined = $state()
	let original = $state('')
	const dirty = $derived(!!editing && JSON.stringify(editing) !== original)
	const edit = (closure: StoreClosure) => {
		editing = {
			id: closure.id,
			start: formatDate(closure.start_time, 'T'),
			end: formatDate(closure.end_time, 'T'),
			message: closure.message,
			show_order_check: closure.show_order_check
		}
		original = JSON.stringify(editing)
		saveError = undefined
		draftError = undefined
	}
	const create = () => {
		const start = new Date()
		const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
		edit({ id: '', start_time: start, end_time: end, message: '', show_order_check: true })
	}

	let saving = $state(false)
	let saveError: unknown = $state()
	let draftError: string | undefined = $state()
	const save = async () => {
		if (!editing) return
		const start = new Date(editing.start)
		const end = new Date(editing.end)
		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
			draftError = 'Enter both a start and an end time.'
			return
		}
		if (end <= start) {
			draftError = 'The end time must be after the start time.'
			return
		}
		draftError = undefined
		saving = true
		saveError = undefined
		try {
			const saved = await api.admin.closures.update({
				id: editing.id,
				start_time: start,
				end_time: end,
				message: editing.message,
				show_order_check: editing.show_order_check
			})
			const idx = closures.findIndex((x) => x.id === saved.id)
			if (idx >= 0) closures[idx] = saved
			else closures = [...closures, saved]
			addFlag({ appearance: 'success', title: 'Closure saved' })
			editing = undefined
		} catch (e) {
			saveError = e
		} finally {
			saving = false
		}
	}

	let deleteOpen = $state(false)
	const remove = async () => {
		if (!editing?.id) return
		const id = editing.id
		await api.admin.closures.remove(id)
		closures = closures.filter((x) => x.id !== id)
		addFlag({ appearance: 'information', title: 'Closure deleted' })
		editing = undefined
	}
</script>

<svelte:head><title>Store closures - Admin</title></svelte:head>

{#if editing}
	<EditorFrame
		listLabel="Store closures"
		title={editing.id ? 'Edit closure' : 'Schedule closure'}
		{dirty}
		{saving}
		error={saveError}
		saveLabel={editing.id ? 'Save closure' : 'Schedule closure'}
		onSave={save}
		onCancel={() => (editing = undefined)}
	>
		{#snippet secondaryActions()}
			{#if editing?.id}
				<Button appearance="subtle" onClick={() => (deleteOpen = true)}>
					{#snippet iconBefore()}<Icon name="trash" class="size-4" />{/snippet}
					Delete
				</Button>
			{/if}
		{/snippet}
		<Card title="Closure">
			<div class="flex flex-col gap-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<TextField label="Starts" type="datetime-local" bind:value={editing.start} required />
					<TextField
						label="Ends"
						type="datetime-local"
						bind:value={editing.end}
						required
						error={draftError}
					/>
				</div>
				<TextField
					label="Message shown to buyers"
					bind:value={editing.message}
					placeholder="e.g. The store reopens after the exam period."
				/>
				<Toggle label="Allow order lookup while closed" bind:checked={editing.show_order_check} />
			</div>
		</Card>
	</EditorFrame>
	<ConfirmDialog
		bind:open={deleteOpen}
		title="Delete this closure?"
		message="The store will be open during this time unless another closure covers it."
		confirmLabel="Delete closure"
		onConfirm={remove}
	/>
{:else}
	<PageHeader
		title="Store closures"
		description="While a closure is active, buyers see a waiting page instead of the store."
	>
		{#snippet actions()}
			<Button appearance="primary" onClick={create}>
				{#snippet iconBefore()}<Icon name="plus" class="size-4" />{/snippet}
				Schedule closure
			</Button>
		{/snippet}
	</PageHeader>
	<ErrorBoundary {error}>
		{#if loading}
			<div class="flex justify-center py-12"><Spinner size="large" /></div>
		{:else if closures.length === 0}
			<EmptyState
				icon="lock-closed"
				title="No closures scheduled"
				description="The store is open whenever a sale period is active."
			>
				<Button appearance="primary" onClick={create}>Schedule closure</Button>
			</EmptyState>
		{:else}
			<div class="ds-table-wrap rounded-ds-lg border border-line bg-surface-raised">
				<table class="ds-table">
					<thead>
						<tr>
							<th scope="col">Status</th>
							<th scope="col">Starts</th>
							<th scope="col">Ends</th>
							<th scope="col">Message</th>
							<th scope="col">Order lookup</th>
							<th scope="col"><span class="sr-only">Actions</span></th>
						</tr>
					</thead>
					<tbody>
						{#each sorted as closure (closure.id)}
							{@const status = statusOf(closure)}
							<tr>
								<td>
									{#if status === 'active'}
										<Lozenge appearance="removed" bold>Active now</Lozenge>
									{:else if status === 'scheduled'}
										<Lozenge appearance="inprogress">Scheduled</Lozenge>
									{:else}
										<Lozenge>Ended</Lozenge>
									{/if}
								</td>
								<td class="whitespace-nowrap">{formatFriendlyDate(closure.start_time)}</td>
								<td class="whitespace-nowrap">{formatFriendlyDate(closure.end_time)}</td>
								<td class="max-w-xs [overflow-wrap:anywhere]">{closure.message}</td>
								<td>{closure.show_order_check ? 'Allowed' : 'Blocked'}</td>
								<td class="text-right">
									<Button spacing="compact" onClick={() => edit(closure)}>Edit</Button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</ErrorBoundary>
{/if}
