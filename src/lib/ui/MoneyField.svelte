<script lang="ts">
	import TextField from './TextField.svelte'

	// Edits an amount stored in cents as dollars, e.g. 1250 <-> "12.50".
	interface Props {
		label: string
		value: number
		helper?: string
		error?: string | null | false
		hideLabel?: boolean
		compact?: boolean
		required?: boolean
		disabled?: boolean
		allowNegative?: boolean
		class?: string
	}
	let {
		label,
		value = $bindable(0),
		helper,
		error,
		hideLabel = false,
		compact = false,
		required = false,
		disabled = false,
		allowNegative = false,
		class: klass = ''
	}: Props = $props()

	const format = (cents: number) => (cents / 100).toFixed(2)
	const parse = (text: string) => {
		const n = Number.parseFloat(text)
		return Number.isNaN(n) ? NaN : Math.round(n * 100)
	}

	let text = $state(format(value))
	// Follow outside changes to the value without fighting the user's typing.
	$effect(() => {
		if (parse(text) !== value) text = format(value)
	})
	const onInput = () => {
		const cents = parse(text)
		if (Number.isNaN(cents)) return
		value = allowNegative ? cents : Math.max(0, cents)
	}
	const onBlur = () => {
		text = format(value)
	}
</script>

<TextField
	{label}
	bind:value={text}
	{helper}
	{error}
	{hideLabel}
	{compact}
	{required}
	{disabled}
	inputmode="decimal"
	autocomplete="off"
	class={klass}
	oninput={onInput}
	onblur={onBlur}
>
	{#snippet elemBefore()}<span class="select-none">S$</span>{/snippet}
</TextField>
