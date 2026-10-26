<script lang="ts">
	import { page } from '$app/state'
	import Icon, { type IconName } from '$lib/ui/Icon.svelte'

	interface Item {
		href: string
		label: string
		icon: IconName
	}
	interface Group {
		label?: string
		items: Item[]
	}
	const groups: Group[] = [
		{
			items: [{ href: '/admin/collect', label: 'Collect orders', icon: 'clipboard-document-check' }]
		},
		{
			label: 'This sale',
			items: [
				{ href: '/admin/products', label: 'Products', icon: 'cube' },
				{ href: '/admin/coupons', label: 'Coupons', icon: 'ticket' },
				{ href: '/admin/summary', label: 'Order summary', icon: 'chart-bar' },
				{ href: '/admin/collections', label: 'Daily collection', icon: 'calendar' },
				{ href: '/admin/stock', label: 'Stock count', icon: 'archive-box' }
			]
		},
		{
			label: 'Settings',
			items: [
				{ href: '/admin/periods', label: 'Sale periods', icon: 'tag' },
				{ href: '/admin/closures', label: 'Store closures', icon: 'lock-closed' },
				{ href: '/admin/users', label: 'Admin users', icon: 'users' }
			]
		}
	]
	const isActive = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`)
</script>

<nav aria-label="Admin" class="ds-sidenav">
	{#each groups as group}
		<div class="ds-sidenav-group">
			{#if group.label}<p class="ds-sidenav-heading">{group.label}</p>{/if}
			<ul class="ds-sidenav-list">
				{#each group.items as item (item.href)}
					<li>
						<a
							href={item.href}
							class="ds-sidenav-item"
							aria-current={isActive(item.href) ? 'page' : undefined}
						>
							<Icon name={item.icon} class="size-5" />
							<span>{item.label}</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</nav>

<style lang="postcss">
	.ds-sidenav {
		@apply sticky top-appbar z-10 flex gap-1 overflow-x-auto border-b border-line bg-surface px-2 py-2;
		@apply md:h-[calc(100vh-56px)] md:w-sidenav md:shrink-0 md:flex-col md:gap-4 md:overflow-y-auto md:border-b-0 md:border-r md:py-4;
	}
	.ds-sidenav-group {
		@apply flex shrink-0 items-center gap-1 md:flex-col md:items-stretch;
	}
	.ds-sidenav-heading {
		@apply hidden px-2 pb-1 text-small font-bold uppercase tracking-wide text-ink-subtlest md:block;
	}
	.ds-sidenav-list {
		@apply flex gap-1 md:flex-col;
	}
	.ds-sidenav-item {
		@apply relative flex h-8 items-center gap-2 whitespace-nowrap rounded-ds px-2 text-body font-medium text-ink-subtle transition-colors hover:bg-n-200 hover:text-ink active:bg-n-300;
	}
	.ds-sidenav-item[aria-current='page'] {
		@apply bg-brand-subtlest text-brand hover:bg-brand-subtlest hover:text-brand;
	}
	/* Selected-item notch on the side navigation. */
	.ds-sidenav-item[aria-current='page']::before {
		content: '';
		@apply absolute left-0 top-1/2 hidden h-3 w-0.5 -translate-y-1/2 rounded-full bg-brand md:block;
	}
</style>
