<script lang="ts">
	import { onMount } from 'svelte'
	import api from '$lib/api'
	import Button from '$lib/ui/Button.svelte'
	import Card from '$lib/ui/Card.svelte'
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte'
	import ErrorBoundary from '$lib/ui/ErrorBoundary.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import PageHeader from '$lib/ui/PageHeader.svelte'
	import Spinner from '$lib/ui/Spinner.svelte'
	import TextField from '$lib/ui/TextField.svelte'
	import { addFlag } from '$lib/ui/flags.svelte'

	let admins: string[] = $state([])
	let loading = $state(true)
	let error: unknown = $state()
	onMount(async () => {
		try {
			admins = await api.admin.users.list()
		} catch (e) {
			error = e
		} finally {
			loading = false
		}
	})

	let newEmail = $state('')
	let newEmailError: string | undefined = $state()
	let adding = $state(false)
	let addError: unknown = $state()
	const add = async () => {
		const email = newEmail.trim().toLowerCase()
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			newEmailError = 'Enter a valid email address.'
			return
		}
		newEmailError = undefined
		adding = true
		addError = undefined
		try {
			await api.admin.users.add(email)
			if (!admins.includes(email)) admins = [...admins, email]
			addFlag({ appearance: 'success', title: 'Admin added', description: email })
			newEmail = ''
		} catch (e) {
			addError = e
		} finally {
			adding = false
		}
	}

	let removing: string | undefined = $state()
	let removeOpen = $state(false)
	const remove = async () => {
		if (!removing) return
		const email = removing
		await api.admin.users.remove(email)
		admins = admins.filter((x) => x !== email)
		addFlag({ appearance: 'information', title: 'Admin removed', description: email })
	}
</script>

<svelte:head><title>Admin users - Admin</title></svelte:head>

<PageHeader
	title="Admin users"
	description="People who can sign in to this admin console with their Google account."
/>

<Card title="Add an admin">
	<form
		class="flex flex-col gap-3 sm:flex-row sm:items-start"
		novalidate
		onsubmit={(e) => {
			e.preventDefault()
			add()
		}}
	>
		<TextField
			label="Email"
			type="email"
			bind:value={newEmail}
			placeholder="name@e.ntu.edu.sg"
			autocomplete="off"
			error={newEmailError}
			class="flex-1"
			oninput={() => (newEmailError = undefined)}
		/>
		<div class="sm:pt-5">
			<Button appearance="primary" type="submit" loading={adding}>
				{#snippet iconBefore()}<Icon name="plus" class="size-4" />{/snippet}
				Add admin
			</Button>
		</div>
	</form>
	<div class="mt-2"><ErrorBoundary error={addError} /></div>
</Card>

<ErrorBoundary {error}>
	{#if loading}
		<div class="flex justify-center py-12"><Spinner size="large" /></div>
	{:else}
		<div class="ds-table-wrap rounded-ds-lg border border-line bg-surface-raised">
			<table class="ds-table">
				<thead>
					<tr>
						<th scope="col">Email</th>
						<th scope="col"><span class="sr-only">Actions</span></th>
					</tr>
				</thead>
				<tbody>
					{#each admins as admin (admin)}
						<tr>
							<td class="break-all">{admin}</td>
							<td class="text-right">
								<Button
									spacing="compact"
									appearance="subtle"
									onClick={() => {
										removing = admin
										removeOpen = true
									}}
								>
									{#snippet iconBefore()}<Icon name="trash" class="size-4" />{/snippet}
									Remove
								</Button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</ErrorBoundary>

<ConfirmDialog
	bind:open={removeOpen}
	title="Remove admin access?"
	message={`${removing ?? ''} will no longer be able to sign in to the admin console.`}
	confirmLabel="Remove access"
	onConfirm={remove}
/>
