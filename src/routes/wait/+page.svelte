<script lang="ts">
	import { onMount } from 'svelte'
	import { formatFriendlyDate, pluralise } from '$lib/util'
	import AppBar from '$lib/ui/AppBar.svelte'
	import Card from '$lib/ui/Card.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import SectionMessage from '$lib/ui/SectionMessage.svelte'
	import OrderLookupForm from '$lib/OrderLookupForm.svelte'
	import type { PageData } from './$types'

	const { data }: { data: PageData } = $props()

	const reopensAt = data.end_time !== null ? new Date(Date.now() + data.end_time * 1000) : null
	let secondsLeft: number | null = $state(data.end_time)
	onMount(() => {
		if (data.end_time === null) return
		const interval = setInterval(() => {
			if (secondsLeft === null) return
			secondsLeft = Math.max(0, secondsLeft - 1)
			if (secondsLeft === 0) {
				clearInterval(interval)
				window.location.reload()
			}
		}, 1000)
		return () => clearInterval(interval)
	})

	// Coarse while far away, precise only in the last minute.
	const countdown = $derived.by(() => {
		if (secondsLeft === null) return ''
		const s = secondsLeft
		if (s >= 3600) {
			return `${pluralise(Math.floor(s / 3600), 'hour')} ${pluralise(Math.floor((s % 3600) / 60), 'minute')}`
		}
		if (s >= 60) return pluralise(Math.floor(s / 60), 'minute')
		return pluralise(s, 'second')
	})
</script>

<svelte:head>
	<title>Store closed - SCDS Merch Store</title>
</svelte:head>

<AppBar />
<main id="main" class="mx-auto flex w-full max-w-prose flex-col gap-4 px-4 py-8">
	<Card>
		<div class="flex flex-col items-center gap-4 text-center">
			<img src="https://ntuscds.com/scds-logo-blue.png" class="size-20" alt="" />
			<div>
				<h1 class="text-h2">The store is closed right now</h1>
				<p class="mt-2 text-body-lg">{data.user_message}</p>
			</div>
			{#if reopensAt}
				<div class="flex items-center gap-2 rounded-ds bg-brand-subtlest px-4 py-2 text-brand">
					<Icon name="clock" class="size-5" />
					<span>
						Reopens {formatFriendlyDate(reopensAt)}
						{#if countdown}<span class="text-ink-subtle" aria-live="off">(in {countdown})</span
							>{/if}
					</span>
				</div>
				<p class="text-small text-ink-subtlest">
					This page refreshes automatically when the store opens.
				</p>
			{/if}
		</div>
	</Card>

	<Card title="Have an existing order?">
		{#if data.allow_order}
			<OrderLookupForm />
		{:else}
			<SectionMessage appearance="information">
				Order lookup is unavailable while the store is closed. Check your NTU email for your order
				details.
			</SectionMessage>
		{/if}
	</Card>
</main>
