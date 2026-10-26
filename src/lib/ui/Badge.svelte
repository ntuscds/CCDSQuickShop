<script lang="ts">
	interface Props {
		value: number
		max?: number
		appearance?: 'default' | 'primary' | 'important'
		label?: string
		class?: string
	}
	const { value, max = 99, appearance = 'default', label, class: klass = '' }: Props = $props()
	const display = $derived(value > max ? `${max}+` : `${value}`)
</script>

<span class="ds-badge {appearance} {klass}" aria-label={label}>{display}</span>

<style lang="postcss">
	.ds-badge {
		@apply inline-flex h-4 min-w-6 items-center justify-center rounded-sm px-1 text-small font-semibold tabular-nums;
	}
	.default {
		@apply bg-na-200 text-ink;
	}
	.primary {
		@apply bg-brand text-ink-inverse;
	}
	.important {
		@apply bg-danger-bold text-ink-inverse;
	}
</style>
