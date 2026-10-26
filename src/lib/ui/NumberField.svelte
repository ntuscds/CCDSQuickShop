<script lang="ts">
	import type { Snippet } from 'svelte'
	import Icon from './Icon.svelte'
	import { uid } from './uid'

	interface Props {
		label: string
		value?: number | null
		min?: number
		max?: number
		step?: number
		placeholder?: string
		helper?: string
		error?: string | null | false
		hideLabel?: boolean
		compact?: boolean
		required?: boolean
		disabled?: boolean
		elemBefore?: Snippet
		elemAfter?: Snippet
		oninput?: () => void
		class?: string
		inputClass?: string
	}
	let {
		label,
		value = $bindable(null),
		min,
		max,
		step,
		placeholder,
		helper,
		error,
		hideLabel = false,
		compact = false,
		required = false,
		disabled = false,
		elemBefore,
		elemAfter,
		oninput,
		class: klass = '',
		inputClass = ''
	}: Props = $props()

	const id = uid('number')
	const errorId = $derived(error ? `${id}-error` : undefined)
	const helperId = $derived(helper ? `${id}-helper` : undefined)
	const describedBy = $derived([errorId, helperId].filter(Boolean).join(' ') || undefined)

	let input: HTMLInputElement | undefined = $state()
	export const focus = () => input?.focus()
</script>

<div class="ds-field {klass}">
	<label for={id} class="ds-label" class:sr-only={hideLabel}>
		{label}{#if required}<span class="ds-required" aria-hidden="true">*</span>{/if}
	</label>
	<div class="ds-control" class:compact class:invalid={!!error} class:disabled>
		{#if elemBefore}<span class="ds-elem">{@render elemBefore()}</span>{/if}
		<input
			{id}
			type="number"
			bind:value
			{min}
			{max}
			{step}
			{placeholder}
			{required}
			{disabled}
			inputmode="numeric"
			class={inputClass}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
			bind:this={input}
			oninput={() => oninput?.()}
		/>
		{#if elemAfter}<span class="ds-elem">{@render elemAfter()}</span>{/if}
	</div>
	{#if error}
		<p id={errorId} class="ds-message is-error">
			<Icon name="exclamation-circle" class="size-4" label="Error" />
			<span>{error}</span>
		</p>
	{:else if helper}
		<p id={helperId} class="ds-message">{helper}</p>
	{/if}
</div>
