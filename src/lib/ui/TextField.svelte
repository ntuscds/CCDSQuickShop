<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLInputAttributes } from 'svelte/elements'
	import Icon from './Icon.svelte'
	import { uid } from './uid'

	interface Props extends Omit<HTMLInputAttributes, 'value' | 'class' | 'size' | 'type'> {
		label: string
		value?: string
		type?: 'text' | 'email' | 'search' | 'password' | 'url' | 'tel' | 'date' | 'datetime-local'
		helper?: string
		// An error message replaces the helper text and marks the field invalid.
		error?: string | null | false
		hideLabel?: boolean
		compact?: boolean
		elemBefore?: Snippet
		elemAfter?: Snippet
		class?: string
	}
	let {
		label,
		value = $bindable(''),
		type = 'text',
		helper,
		error,
		hideLabel = false,
		compact = false,
		elemBefore,
		elemAfter,
		class: klass = '',
		id = uid('field'),
		required,
		disabled,
		oninput,
		...rest
	}: Props = $props()

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
			{type}
			{value}
			{required}
			{disabled}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
			bind:this={input}
			oninput={(e) => {
				value = e.currentTarget.value
				oninput?.(e)
			}}
			{...rest}
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
