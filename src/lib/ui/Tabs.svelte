<script lang="ts">
	import type { Snippet } from 'svelte'
	import { uid } from './uid'

	interface Tab {
		id: string
		label: string
	}
	interface Props {
		tabs: Tab[]
		value: string
		label: string
		// Rendered inside the tab panel for the selected tab.
		panel?: Snippet<[Tab]>
		class?: string
	}
	let { tabs, value = $bindable(), label, panel, class: klass = '' }: Props = $props()

	const base = uid('tabs')
	let buttons: HTMLButtonElement[] = []

	const select = (i: number) => {
		value = tabs[i].id
		buttons[i]?.focus()
	}
	const onKeydown = (i: number) => (e: KeyboardEvent) => {
		const last = tabs.length - 1
		switch (e.key) {
			case 'ArrowRight':
				select(i === last ? 0 : i + 1)
				break
			case 'ArrowLeft':
				select(i === 0 ? last : i - 1)
				break
			case 'Home':
				select(0)
				break
			case 'End':
				select(last)
				break
			default:
				return
		}
		e.preventDefault()
	}
	const selectedTab = $derived(tabs.find((t) => t.id === value))
</script>

<div class={klass}>
	<div role="tablist" aria-label={label} class="ds-tablist">
		{#each tabs as tab, i}
			<button
				type="button"
				role="tab"
				id="{base}-tab-{tab.id}"
				aria-selected={value === tab.id}
				aria-controls="{base}-panel-{tab.id}"
				tabindex={value === tab.id ? 0 : -1}
				class="ds-tab"
				bind:this={buttons[i]}
				onclick={() => (value = tab.id)}
				onkeydown={onKeydown(i)}
			>
				{tab.label}
			</button>
		{/each}
	</div>
	{#if panel && selectedTab}
		<div
			role="tabpanel"
			id="{base}-panel-{selectedTab.id}"
			aria-labelledby="{base}-tab-{selectedTab.id}"
			tabindex="0"
			class="ds-tabpanel"
		>
			{@render panel(selectedTab)}
		</div>
	{/if}
</div>

<style lang="postcss">
	.ds-tablist {
		@apply flex overflow-x-auto border-b border-line;
	}
	.ds-tab {
		@apply -mb-px shrink-0 rounded-ds-sm border-b-2 border-transparent px-3 py-2 text-body font-medium text-ink-subtle transition-colors hover:border-line hover:text-ink;
	}
	.ds-tab[aria-selected='true'] {
		@apply border-brand text-brand hover:border-brand hover:text-brand;
	}
	.ds-tabpanel {
		@apply pt-4;
	}
	.ds-tabpanel:focus-visible {
		outline-offset: -2px;
	}
</style>
