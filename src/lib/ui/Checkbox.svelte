<script lang="ts">
	import { uid } from './uid'

	interface Props {
		label: string
		checked?: boolean
		disabled?: boolean
		helper?: string
		onchange?: () => void
		class?: string
	}
	let {
		label,
		checked = $bindable(false),
		disabled = false,
		helper,
		onchange,
		class: klass = ''
	}: Props = $props()
	const id = uid('checkbox')
	const helperId = $derived(helper ? `${id}-helper` : undefined)
</script>

<div class="flex flex-col gap-1 {klass}">
	<label
		for={id}
		class="inline-flex cursor-pointer items-start gap-2 text-body"
		class:cursor-not-allowed={disabled}
		class:text-ink-disabled={disabled}
	>
		<input
			{id}
			type="checkbox"
			bind:checked
			{disabled}
			class="ds-checkbox"
			aria-describedby={helperId}
			onchange={() => onchange?.()}
		/>
		<span>{label}</span>
	</label>
	{#if helper}<p id={helperId} class="ds-message pl-6">{helper}</p>{/if}
</div>

<style lang="postcss">
	.ds-checkbox {
		@apply mt-0.5 size-4 shrink-0 cursor-pointer appearance-none rounded-sm border-2 border-line-input bg-surface transition-colors;
		@apply checked:border-brand checked:bg-brand hover:bg-surface-sunken checked:hover:bg-brand-hover;
		@apply disabled:cursor-not-allowed disabled:border-line-disabled disabled:bg-na-100;
		background-position: center;
		background-repeat: no-repeat;
		background-size: 12px;
	}
	.ds-checkbox:checked {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 12.5 4.5 4.5L19 7'/%3E%3C/svg%3E");
	}
</style>
