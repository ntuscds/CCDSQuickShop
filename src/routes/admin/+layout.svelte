<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import api, { PendingAuthError, RETURN_TO_KEY } from '$lib/api'
	import AppBar from '$lib/ui/AppBar.svelte'
	import Button from '$lib/ui/Button.svelte'
	import ErrorBoundary from '$lib/ui/ErrorBoundary.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import SectionMessage from '$lib/ui/SectionMessage.svelte'
	import Select from '$lib/ui/Select.svelte'
	import Spinner from '$lib/ui/Spinner.svelte'
	import AdminNav from './AdminNav.svelte'
	import { PERIOD_SCOPED_PATHS, currentPeriodID, setAdminContext, type AdminState } from './context'

	let { children } = $props()

	const admin: AdminState = $state({
		periods: [],
		period: '',
		loading: true,
		error: undefined,
		reloadPeriods: async () => {}
	})
	setAdminContext(admin)

	// The selected sale period survives navigation within the admin console.
	const STORAGE_KEY = 'adminSalePeriod'
	const loadPeriods = async () => {
		admin.periods = await api.admin.listSales()
		const requested = page.url.searchParams.get('period') ?? sessionStorage.getItem(STORAGE_KEY)
		const valid = requested && admin.periods.some((p) => p.id === requested) ? requested : undefined
		admin.period = valid ?? currentPeriodID(admin.periods) ?? ''
	}
	admin.reloadPeriods = async () => {
		admin.periods = await api.admin.listSales()
		if (!admin.periods.some((p) => p.id === admin.period)) {
			admin.period = currentPeriodID(admin.periods) ?? ''
		}
	}
	onMount(async () => {
		try {
			await api.admin.checkPerm()
			// Signing in always lands on /admin; return to the page that was requested.
			const returnTo = sessionStorage.getItem(RETURN_TO_KEY)
			if (returnTo) {
				sessionStorage.removeItem(RETURN_TO_KEY)
				if (returnTo.startsWith('/admin') && returnTo !== page.url.pathname + page.url.search) {
					await goto(returnTo, { replaceState: true })
				}
			}
			await loadPeriods()
		} catch (e) {
			// While the browser is being redirected to sign in, keep the loading state.
			if (e instanceof PendingAuthError) return
			admin.error = e
		}
		admin.loading = false
	})
	$effect(() => {
		if (admin.period) sessionStorage.setItem(STORAGE_KEY, admin.period)
	})

	const currentID = $derived(currentPeriodID(admin.periods))
	const selectedPeriod = $derived(admin.periods.find((p) => p.id === admin.period))
	const periodScoped = $derived(
		PERIOD_SCOPED_PATHS.some((path) => page.url.pathname.startsWith(path))
	)
</script>

<svelte:head>
	<title>Admin - SCDS Merch Store</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<AppBar admin fluid href="/admin">
		{#if admin.periods.length > 0}
			<div class="hidden w-64 md:block">
				<Select label="Sale period" hideLabel compact bind:value={admin.period}>
					{#each admin.periods as p (p.id)}
						<option value={p.id}>{p.name}{p.id === currentID ? ' (current)' : ''}</option>
					{/each}
				</Select>
			</div>
		{/if}
		<Button appearance="subtle" href="/" target="_blank">
			{#snippet iconAfter()}<Icon name="arrow-top-right-on-square" class="size-4" />{/snippet}
			View store
		</Button>
	</AppBar>

	<div class="flex flex-1 flex-col md:flex-row">
		<AdminNav />
		<main id="main" class="min-w-0 flex-1 p-4 md:p-6">
			{#if admin.loading}
				<div class="flex justify-center py-12">
					<Spinner size="large" label="Loading admin console" />
				</div>
			{:else if admin.error}
				<ErrorBoundary error={admin.error} title="Could not load the admin console" />
			{:else}
				<div class="mx-auto flex w-full max-w-page flex-col gap-4">
					{#if periodScoped}
						{#if admin.periods.length > 0}
							<div class="md:hidden">
								<Select label="Sale period" compact bind:value={admin.period}>
									{#each admin.periods as p (p.id)}
										<option value={p.id}>{p.name}{p.id === currentID ? ' (current)' : ''}</option>
									{/each}
								</Select>
							</div>
						{/if}
						{#if selectedPeriod && admin.period !== currentID}
							<SectionMessage appearance="warning">
								You are viewing <strong>{selectedPeriod.name}</strong>, which is not the sale period
								currently shown in the store.
								{#snippet actions()}
									{#if currentID}
										<button
											type="button"
											class="ds-link"
											onclick={() => (admin.period = currentID)}
										>
											Switch to the current sale period
										</button>
									{/if}
								{/snippet}
							</SectionMessage>
						{/if}
					{/if}
					{@render children()}
				</div>
			{/if}
		</main>
	</div>
</div>
