<script lang="ts" generics="T">
	/* eslint-disable no-undef -- `T` comes from the `generics` attribute. */
	import type { Snippet } from 'svelte'
	import Icon from './Icon.svelte'
	import { uid } from './uid'

	interface Props {
		label: string
		value?: T
		children: Snippet
		helper?: string
		error?: string | null | false
		hideLabel?: boolean
		compact?: boolean
		required?: boolean
		disabled?: boolean
		onchange?: () => void
		class?: string
	}
	let {
		label,
		value = $bindable(),
		children,
		helper,
		error,
		hideLabel = false,
		compact = false,
		required = false,
		disabled = false,
		onchange,
		class: klass = ''
	}: Props = $props()

	const id = uid('select')
	const errorId = $derived(error ? `${id}-error` : undefined)
	const helperId = $derived(helper ? `${id}-helper` : undefined)
	const describedBy = $derived([errorId, helperId].filter(Boolean).join(' ') || undefined)
</script>

<div class="ds-field {klass}">
	<label for={id} class="ds-label" class:sr-only={hideLabel}>
		{label}{#if required}<span class="ds-required" aria-hidden="true">*</span>{/if}
	</label>
	<div class="ds-control relative" class:compact class:invalid={!!error} class:disabled>
		<select
			{id}
			bind:value
			{required}
			{disabled}
			class="cursor-pointer appearance-none pr-8"
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
			onchange={() => onchange?.()}
		>
			{@render children()}
		</select>
		<span class="pointer-events-none absolute right-2 text-ink-subtlest">
			<Icon name="chevron-down" class="size-4" />
		</span>
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
