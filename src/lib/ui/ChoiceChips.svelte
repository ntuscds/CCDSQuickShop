<script lang="ts">
	import Icon from './Icon.svelte'

	interface Choice {
		value: string
		label: string
		description?: string
	}
	interface Props {
		label: string
		options: Choice[]
		value?: string
		// Called with the option being hovered/focused, falling back to the selection.
		onPreview?: (value?: string) => void
		id?: string
		describedBy?: string
		class?: string
	}
	let {
		label,
		options,
		value = $bindable(),
		onPreview,
		id,
		describedBy,
		class: klass = ''
	}: Props = $props()

	// Moves keyboard focus to the group (used when the buyer forgot to choose).
	export const focus = () => {
		const i = options.findIndex((o) => o.value === value)
		buttons[i >= 0 ? i : 0]?.focus()
	}

	let hover: string | undefined = $state()
	$effect(() => {
		onPreview?.(hover ?? value)
	})

	let buttons: HTMLButtonElement[] = []
	const select = (i: number) => {
		value = options[i].value
		buttons[i]?.focus()
	}
	// Radio group keyboard behaviour: arrows move the selection.
	const onKeydown = (i: number) => (e: KeyboardEvent) => {
		const last = options.length - 1
		switch (e.key) {
			case 'ArrowRight':
			case 'ArrowDown':
				select(i === last ? 0 : i + 1)
				break
			case 'ArrowLeft':
			case 'ArrowUp':
				select(i === 0 ? last : i - 1)
				break
			case ' ':
			case 'Enter':
				select(i)
				break
			default:
				return
		}
		e.preventDefault()
	}
	const isTabStop = (i: number) => (value !== undefined ? options[i].value === value : i === 0)
</script>

<div
	{id}
	role="radiogroup"
	aria-label={label}
	aria-describedby={describedBy}
	class="flex flex-wrap gap-2 {klass}"
	onpointerleave={() => (hover = undefined)}
>
	{#each options as option, i}
		<button
			type="button"
			role="radio"
			aria-checked={value === option.value}
			tabindex={isTabStop(i) ? 0 : -1}
			class="ds-chip"
			bind:this={buttons[i]}
			onclick={() => (value = option.value)}
			onpointerenter={() => (hover = option.value)}
			onfocus={() => (hover = option.value)}
			onblur={() => (hover = undefined)}
			onkeydown={onKeydown(i)}
		>
			{#if value === option.value}<Icon name="check" class="size-4" strokeWidth={2} />{/if}
			<span>{option.label}</span>
			{#if option.description}
				<span class="ds-chip-description">{option.description}</span>
			{/if}
		</button>
	{/each}
</div>

<style lang="postcss">
	.ds-chip {
		@apply inline-flex min-h-8 items-center gap-1 rounded-ds border border-line-bold bg-surface px-3 py-1 text-body font-medium text-ink transition-colors hover:bg-na-200;
	}
	.ds-chip[aria-checked='true'] {
		@apply border-brand bg-brand-subtlest text-brand;
		box-shadow: inset 0 0 0 1px theme('colors.brand.DEFAULT');
	}
	.ds-chip-description {
		@apply text-small font-normal text-ink-subtlest;
	}
	.ds-chip[aria-checked='true'] .ds-chip-description {
		@apply text-brand;
	}
</style>
