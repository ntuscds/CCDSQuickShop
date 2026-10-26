<script lang="ts">
	interface Crumb {
		label: string
		onClick?: () => void
		href?: string
	}
	interface Props {
		items: Crumb[]
	}
	const { items }: Props = $props()
</script>

<nav aria-label="Breadcrumbs">
	<ol class="flex flex-wrap items-center gap-1 text-body">
		{#each items as item, i}
			{@const last = i === items.length - 1}
			<li class="flex items-center gap-1">
				{#if last}
					<span class="text-ink-subtlest" aria-current="page">{item.label}</span>
				{:else if item.href}
					<a href={item.href} class="ds-crumb">{item.label}</a>
				{:else}
					<button type="button" class="ds-crumb" onclick={item.onClick}>{item.label}</button>
				{/if}
				{#if !last}<span class="px-1 text-ink-subtlest" aria-hidden="true">/</span>{/if}
			</li>
		{/each}
	</ol>
</nav>

<style lang="postcss">
	.ds-crumb {
		@apply rounded-ds-sm text-ink-subtlest hover:text-ink hover:underline active:text-ink;
	}
</style>
