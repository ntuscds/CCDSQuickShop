<script lang="ts">
	import Icon from './Icon.svelte'
	import { uid } from './uid'

	interface Props {
		label: string
		checked?: boolean
		disabled?: boolean
		hideLabel?: boolean
		onchange?: () => void
		class?: string
	}
	let {
		label,
		checked = $bindable(false),
		disabled = false,
		hideLabel = false,
		onchange,
		class: klass = ''
	}: Props = $props()
	const id = uid('toggle')
</script>

<label
	for={id}
	class="inline-flex cursor-pointer items-center gap-2 text-body {klass}"
	class:cursor-not-allowed={disabled}
	class:text-ink-disabled={disabled}
>
	<span class="relative inline-flex">
		<input
			{id}
			type="checkbox"
			role="switch"
			bind:checked
			{disabled}
			class="peer sr-only"
			onchange={() => onchange?.()}
		/>
		<span class="ds-toggle-track" aria-hidden="true">
			<span class="ds-toggle-icon ds-toggle-on"
				><Icon name="check" class="size-3" strokeWidth={3} /></span
			>
			<span class="ds-toggle-icon ds-toggle-off"
				><Icon name="x" class="size-3" strokeWidth={3} /></span
			>
			<span class="ds-toggle-knob"></span>
		</span>
	</span>
	<span class:sr-only={hideLabel}>{label}</span>
</label>

<style lang="postcss">
	.ds-toggle-track {
		@apply relative flex h-5 w-10 items-center rounded-full bg-n-600 text-ink-inverse transition-colors;
	}
	.ds-toggle-icon {
		@apply absolute top-1 flex;
	}
	.ds-toggle-on {
		@apply left-1 opacity-0;
	}
	.ds-toggle-off {
		@apply right-1 opacity-100;
	}
	.ds-toggle-knob {
		@apply absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-raised transition-transform;
	}
	.peer:hover ~ .ds-toggle-track {
		@apply bg-n-700;
	}
	.peer:checked ~ .ds-toggle-track {
		@apply bg-success-bold;
	}
	.peer:checked:hover ~ .ds-toggle-track {
		@apply bg-success-bold-hover;
	}
	.peer:checked ~ .ds-toggle-track .ds-toggle-knob {
		@apply translate-x-5;
	}
	.peer:checked ~ .ds-toggle-track .ds-toggle-on {
		@apply opacity-100;
	}
	.peer:checked ~ .ds-toggle-track .ds-toggle-off {
		@apply opacity-0;
	}
	.peer:focus-visible ~ .ds-toggle-track {
		outline: 2px solid theme('colors.brand.DEFAULT');
		outline-offset: 2px;
	}
	.peer:disabled ~ .ds-toggle-track {
		@apply bg-na-200 text-ink-disabled;
	}
</style>
