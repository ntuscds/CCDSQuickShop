<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
		title?: string
		description?: string
		actions?: Snippet
		padding?: boolean
		as?: 'div' | 'section' | 'article'
		class?: string
	}
	const {
		children,
		title,
		description,
		actions,
		padding = true,
		as = 'div',
		class: klass = ''
	}: Props = $props()
</script>

<svelte:element this={as} class="ds-card {klass}" class:p-4={padding}>
	{#if title || actions}
		<header class="mb-4 flex flex-wrap items-start justify-between gap-2">
			<div class="min-w-0">
				{#if title}<h2 class="text-h3">{title}</h2>{/if}
				{#if description}<p class="mt-1 text-ink-subtle">{description}</p>{/if}
			</div>
			{#if actions}<div class="flex shrink-0 flex-wrap gap-2">{@render actions()}</div>{/if}
		</header>
	{/if}
	{@render children()}
</svelte:element>

<style lang="postcss">
	.ds-card {
		@apply rounded-ds-lg border border-line bg-surface-raised shadow-raised;
	}
</style>
