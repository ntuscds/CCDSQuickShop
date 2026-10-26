<script lang="ts">
	import { goto } from '$app/navigation'
	import { normaliseOrderQuery } from '$lib/util'
	import Button from '$lib/ui/Button.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import TextField from '$lib/ui/TextField.svelte'

	interface Props {
		// Pre-filled value, e.g. the query of the order page being viewed.
		value?: string
		autofocus?: boolean
		compact?: boolean
	}
	const { value: initial = '', autofocus = false, compact = false }: Props = $props()

	let query = $state(initial)
	let error: string | undefined = $state()
	let field: TextField | undefined = $state()

	$effect(() => {
		if (autofocus) field?.focus()
	})

	const submit = async () => {
		const q = normaliseOrderQuery(query)
		if (!q) {
			error = 'Enter your order ID, matric number or NTU email.'
			field?.focus()
			return
		}
		error = undefined
		await goto(`/orders/${encodeURIComponent(q)}`)
	}
</script>

<form
	class="flex flex-col gap-3"
	onsubmit={(e) => {
		e.preventDefault()
		submit()
	}}
>
	<TextField
		label="Order ID, matric number or NTU email"
		bind:value={query}
		helper="e.g. AB1234 or U1234567A"
		{error}
		autocapitalize="characters"
		autocomplete="off"
		spellcheck={false}
		enterkeyhint="search"
		{compact}
		oninput={() => (error = undefined)}
		bind:this={field}
	/>
	<div>
		<Button
			appearance="primary"
			type="submit"
			onClick={submit}
			spacing={compact ? 'compact' : 'default'}
		>
			{#snippet iconBefore()}<Icon name="magnifying-glass" class="size-4" />{/snippet}
			Find order
		</Button>
	</div>
</form>
