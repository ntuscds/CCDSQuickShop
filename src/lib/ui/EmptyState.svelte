<script lang="ts">
	import type { Snippet } from 'svelte'
	import Icon, { type IconName } from './Icon.svelte'

	interface Props {
		title: string
		description?: string
		icon?: IconName
		compact?: boolean
		children?: Snippet
		class?: string
	}
	const {
		title,
		description,
		icon = 'archive-box',
		compact = false,
		children,
		class: klass = ''
	}: Props = $props()
</script>

<div
	class="flex flex-col items-center text-center {klass}"
	class:py-12={!compact}
	class:py-6={compact}
>
	<span
		class="mb-3 flex size-12 items-center justify-center rounded-full bg-na-200 text-ink-subtle"
	>
		<Icon name={icon} class="size-6" />
	</span>
	<p class:text-h3={!compact} class:text-h4={compact}>{title}</p>
	{#if description}<p class="mt-1 max-w-prose text-ink-subtle">{description}</p>{/if}
	{#if children}<div class="mt-4 flex flex-wrap justify-center gap-2">
			{@render children()}
		</div>{/if}
</div>
