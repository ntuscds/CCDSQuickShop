<script lang="ts">
	import Icon from './Icon.svelte'

	interface Props {
		value: number
		min?: number
		max?: number
		label: string
		compact?: boolean
	}
	let { value = $bindable(1), min = 1, max = 50, label, compact = false }: Props = $props()

	const set = (v: number) => {
		if (Number.isNaN(v)) return
		value = Math.min(max, Math.max(min, Math.round(v)))
	}
</script>

<div class="ds-stepper" class:compact role="group" aria-label={label}>
	<button
		type="button"
		class="ds-stepper-button"
		onclick={() => set(value - 1)}
		disabled={value <= min}
		aria-label="Decrease quantity"
	>
		<Icon name="minus" class="size-4" />
	</button>
	<input
		type="number"
		class="ds-stepper-input"
		aria-label="Quantity"
		{value}
		{min}
		{max}
		onchange={(e) => {
			set(e.currentTarget.valueAsNumber)
			// Re-render the clamped value if the input was out of range.
			e.currentTarget.value = `${value}`
		}}
	/>
	<button
		type="button"
		class="ds-stepper-button"
		onclick={() => set(value + 1)}
		disabled={value >= max}
		aria-label="Increase quantity"
	>
		<Icon name="plus" class="size-4" />
	</button>
</div>

<style lang="postcss">
	.ds-stepper {
		@apply inline-flex h-8 items-stretch overflow-hidden rounded-ds border border-line-input bg-surface;
	}
	.ds-stepper.compact {
		@apply h-7;
	}
	.ds-stepper-button {
		@apply flex w-8 items-center justify-center text-ink-subtle transition-colors hover:bg-na-200 disabled:cursor-not-allowed disabled:text-ink-disabled disabled:hover:bg-transparent;
	}
	.ds-stepper-button:focus-visible {
		outline-offset: -2px;
	}
	.ds-stepper-input {
		@apply w-10 bg-transparent text-center tabular-nums outline-none;
		-moz-appearance: textfield;
	}
	.ds-stepper-input::-webkit-outer-spin-button,
	.ds-stepper-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.ds-stepper-input:focus-visible {
		outline-offset: -2px;
	}
</style>
