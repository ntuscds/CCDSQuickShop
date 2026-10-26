<script lang="ts">
	import { page } from '$app/state'
	import AppBar from '$lib/ui/AppBar.svelte'
	import Button from '$lib/ui/Button.svelte'
	import Card from '$lib/ui/Card.svelte'
	import Icon from '$lib/ui/Icon.svelte'

	const title = $derived(page.status === 404 ? 'Not found' : 'Something went wrong')
</script>

<svelte:head>
	<title>{title} - SCDS Merch Store</title>
</svelte:head>

<AppBar />
<main id="main" class="mx-auto w-full max-w-prose px-4 py-8">
	<Card>
		<div class="flex flex-col items-center gap-4 text-center">
			<span
				class="flex size-12 items-center justify-center rounded-full bg-danger-subtle text-danger"
			>
				<Icon name="exclamation-triangle" class="size-6" />
			</span>
			<div>
				<h1 class="text-h2">{title}</h1>
				<p class="mt-2">{page.error?.message || 'Additional error details are unavailable.'}</p>
				<p class="mt-2 text-ink-subtle">
					If you did not expect this and it keeps happening, contact SCDS Club with details on how
					to reproduce the issue.
				</p>
			</div>
			<div class="flex flex-wrap justify-center gap-2">
				<Button appearance="primary" href="/">Return to store</Button>
				<Button href="mailto:scds-business@e.ntu.edu.sg?subject=%5BMerch%20Shop%5D%20Error">
					Contact us
				</Button>
			</div>
		</div>
	</Card>
</main>
