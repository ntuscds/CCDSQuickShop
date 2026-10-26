<script lang="ts">
	interface Props {
		size?: 'small' | 'medium' | 'large'
		label?: string
		inverse?: boolean
		class?: string
	}
	const { size = 'medium', label = 'Loading', inverse = false, class: klass = '' }: Props = $props()
	const px = $derived({ small: 16, medium: 24, large: 48 }[size])
</script>

<svg
	role="img"
	aria-label={label}
	width={px}
	height={px}
	viewBox="0 0 24 24"
	fill="none"
	class="ds-spinner shrink-0 {klass}"
	class:inverse
>
	<circle
		cx="12"
		cy="12"
		r="10"
		stroke="currentColor"
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-dasharray="47 16"
	/>
</svg>

<style lang="postcss">
	.ds-spinner {
		@apply text-ink-subtle;
		animation: ds-spin 0.9s linear infinite;
	}
	.ds-spinner.inverse {
		@apply text-ink-inverse;
	}
	@keyframes ds-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
