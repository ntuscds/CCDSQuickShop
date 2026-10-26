<script lang="ts">
	import api, { type SalePeriod } from '$lib/api'
	import { formatDate, formatFriendlyDate } from '$lib/util'
	import Button from '$lib/ui/Button.svelte'
	import Card from '$lib/ui/Card.svelte'
	import ErrorBoundary from '$lib/ui/ErrorBoundary.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import Lozenge from '$lib/ui/Lozenge.svelte'
	import PageHeader from '$lib/ui/PageHeader.svelte'
	import SectionMessage from '$lib/ui/SectionMessage.svelte'
	import TextField from '$lib/ui/TextField.svelte'
	import { addFlag } from '$lib/ui/flags.svelte'
	import { getAdminContext, periodStatus } from './context'
	import EditorFrame from './EditorFrame.svelte'

	const admin = getAdminContext()
	const sorted = $derived(
		[...admin.periods].sort((a, b) => b.start_time.getTime() - a.start_time.getTime())
	)

	interface Draft {
		id: string
		name: string
		start: string
	}
	let editing: Draft | undefined = $state()
	let original = $state('')
	const dirty = $derived(!!editing && JSON.stringify(editing) !== original)
	const edit = (period: SalePeriod) => {
		editing = { id: period.id, name: period.name, start: formatDate(period.start_time, 'T') }
		original = JSON.stringify(editing)
		saveError = undefined
		draftError = undefined
	}
	const create = () => edit({ id: '', name: '', start_time: new Date() })

	let saving = $state(false)
	let saveError: unknown = $state()
	let draftError: string | undefined = $state()
	const save = async () => {
		if (!editing) return
		const start = new Date(editing.start)
		if (!editing.name.trim()) {
			draftError = 'Enter a name.'
			return
		}
		if (Number.isNaN(start.getTime())) {
			draftError = 'Enter a start time.'
			return
		}
		draftError = undefined
		saving = true
		saveError = undefined
		try {
			const saved = await api.admin.updateSales({
				id: editing.id,
				name: editing.name.trim(),
				start_time: start
			})
			await admin.reloadPeriods()
			addFlag({ appearance: 'success', title: 'Sale period saved', description: saved.name })
			editing = undefined
		} catch (e) {
			saveError = e
		} finally {
			saving = false
		}
	}
</script>

<svelte:head><title>Sale periods - Admin</title></svelte:head>

{#if editing}
	<EditorFrame
		listLabel="Sale periods"
		title={editing.id ? editing.name || 'Edit sale period' : 'New sale period'}
		{dirty}
		{saving}
		error={saveError}
		saveLabel={editing.id ? 'Save sale period' : 'Create sale period'}
		onSave={save}
		onCancel={() => (editing = undefined)}
	>
		<Card title="Sale period">
			<div class="flex flex-col gap-4">
				<TextField
					label="Name"
					bind:value={editing.name}
					required
					placeholder="e.g. AY25/26 Semester 1"
					error={draftError && !editing.name.trim() ? draftError : undefined}
				/>
				<TextField
					label="Starts"
					type="datetime-local"
					bind:value={editing.start}
					required
					helper="The store shows the latest sale period that has started."
					error={draftError && editing.name.trim() ? draftError : undefined}
				/>
			</div>
		</Card>
	</EditorFrame>
{:else}
	<PageHeader
		title="Sale periods"
		description="Each sale period has its own products, coupons and orders. The store shows the latest one that has started."
	>
		{#snippet actions()}
			<Button appearance="primary" onClick={create}>
				{#snippet iconBefore()}<Icon name="plus" class="size-4" />{/snippet}
				Add sale period
			</Button>
		{/snippet}
	</PageHeader>
	<ErrorBoundary error={admin.error}>
		{#if sorted.length === 0}
			<SectionMessage appearance="warning"
				>No sale periods exist yet. Create one to start selling.</SectionMessage
			>
		{:else}
			<div class="ds-table-wrap rounded-ds-lg border border-line bg-surface-raised">
				<table class="ds-table">
					<thead>
						<tr>
							<th scope="col">Name</th>
							<th scope="col">Starts</th>
							<th scope="col">Status</th>
							<th scope="col"><span class="sr-only">Actions</span></th>
						</tr>
					</thead>
					<tbody>
						{#each sorted as period (period.id)}
							{@const status = periodStatus(period, admin.periods)}
							<tr class:is-selected={period.id === admin.period}>
								<td class="font-medium">{period.name}</td>
								<td class="whitespace-nowrap">{formatFriendlyDate(period.start_time)}</td>
								<td>
									{#if status === 'current'}
										<Lozenge appearance="success">Current</Lozenge>
									{:else if status === 'upcoming'}
										<Lozenge appearance="inprogress">Upcoming</Lozenge>
									{:else}
										<Lozenge>Past</Lozenge>
									{/if}
								</td>
								<td class="text-right">
									<span class="inline-flex gap-1">
										{#if period.id !== admin.period}
											<Button
												spacing="compact"
												appearance="subtle"
												onClick={() => (admin.period = period.id)}
											>
												Work on this period
											</Button>
										{:else}
											<span class="px-2 py-0.5 text-small text-ink-subtle">Selected</span>
										{/if}
										<Button spacing="compact" onClick={() => edit(period)}>Edit</Button>
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</ErrorBoundary>
{/if}
