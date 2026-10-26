<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		title: string
		description?: string
		breadcrumbs?: Snippet
		actions?: Snippet
		children?: Snippet
		class?: string
	}
	const { title, description, breadcrumbs, actions, children, class: klass = '' }: Props = $props()
</script>

<div class="flex flex-col gap-2 {klass}">
	{#if breadcrumbs}{@render breadcrumbs()}{/if}
	<div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
		<div class="min-w-0">
			<h1 class="text-h2 md:text-h1">{title}</h1>
			{#if description}<p class="mt-1 text-ink-subtle">{description}</p>{/if}
		</div>
		{#if actions}<div class="flex shrink-0 flex-wrap items-center gap-2">
				{@render actions()}
			</div>{/if}
	</div>
	{#if children}{@render children()}{/if}
</div>
