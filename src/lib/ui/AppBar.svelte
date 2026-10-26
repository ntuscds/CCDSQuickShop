<script lang="ts">
	import type { Snippet } from 'svelte'
	import Lozenge from './Lozenge.svelte'

	interface Props {
		title?: string
		admin?: boolean
		href?: string
		// Full-width bar (admin) instead of the page-width storefront bar.
		fluid?: boolean
		children?: Snippet
	}
	const {
		title = 'Merch Store',
		admin = false,
		href = '/',
		fluid = false,
		children
	}: Props = $props()
</script>

<header class="sticky top-0 z-20 h-appbar border-b border-line bg-surface">
	<div class="flex h-full items-center gap-3 px-4" class:mx-auto={!fluid} class:max-w-page={!fluid}>
		<a {href} class="-ml-1 flex items-center gap-2 px-1 py-1 text-ink no-underline">
			<img src="https://ntuscds.com/scds-logo-blue.png" alt="" class="size-8" />
			<span class="text-h4 leading-none">
				SCDS
				<span class="font-normal text-ink-subtle">{title}</span>
			</span>
			{#if admin}<Lozenge appearance="inprogress" bold>Admin</Lozenge>{/if}
		</a>
		<div class="ml-auto flex items-center gap-2">{@render children?.()}</div>
	</div>
</header>
