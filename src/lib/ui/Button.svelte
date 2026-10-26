<script lang="ts">
	import type { Snippet } from 'svelte'
	import Spinner from './Spinner.svelte'

	type Appearance = 'primary' | 'default' | 'subtle' | 'danger' | 'warning' | 'link' | 'subtle-link'

	interface Props {
		children: Snippet
		onClick?: () => unknown
		appearance?: Appearance
		spacing?: 'default' | 'compact'
		disabled?: boolean
		loading?: boolean
		type?: 'button' | 'submit'
		href?: string
		target?: string
		fullWidth?: boolean
		// Square button that only contains an icon; `label` is then required.
		iconOnly?: boolean
		iconBefore?: Snippet
		iconAfter?: Snippet
		label?: string
		title?: string
		id?: string
		class?: string
	}
	const {
		children,
		onClick,
		appearance = 'default',
		spacing = 'default',
		disabled = false,
		loading: forceLoading = false,
		type = 'button',
		href,
		target,
		fullWidth = false,
		iconOnly = false,
		iconBefore,
		iconAfter,
		label,
		title,
		id,
		class: klass = ''
	}: Props = $props()

	// While an async onClick runs the button shows a spinner and ignores clicks.
	let pending = $state(false)
	export const click = async () => {
		if (isDisabled) return
		try {
			pending = true
			await onClick?.()
		} catch (e) {
			console.error('Unhandled onClick error', e)
		} finally {
			pending = false
		}
	}

	const isLoading = $derived(forceLoading || pending)
	const isDisabled = $derived(disabled || isLoading)
	const classes = $derived(
		[
			'ds-button',
			appearance,
			spacing,
			fullWidth && 'w-full',
			iconOnly && 'icon-only',
			isLoading && 'is-loading',
			klass
		]
			.filter(Boolean)
			.join(' ')
	)
	const inverseSpinner = $derived(appearance === 'primary' || appearance === 'danger')
</script>

{#snippet content()}
	<span class="ds-button-content">
		{#if iconBefore}<span class="ds-button-icon">{@render iconBefore()}</span>{/if}
		<span class="ds-button-label">{@render children()}</span>
		{#if iconAfter}<span class="ds-button-icon">{@render iconAfter()}</span>{/if}
	</span>
	{#if isLoading}
		<span class="ds-button-spinner"><Spinner size="small" inverse={inverseSpinner} /></span>
	{/if}
{/snippet}

{#if href && !isDisabled}
	<a
		{href}
		{target}
		{id}
		{title}
		class={classes}
		aria-label={label}
		rel={target === '_blank' ? 'noopener noreferrer' : undefined}
	>
		{@render content()}
	</a>
{:else}
	<button
		{type}
		{id}
		{title}
		class={classes}
		disabled={isDisabled}
		aria-busy={isLoading || undefined}
		aria-label={label}
		onclick={onClick ? click : undefined}
	>
		{@render content()}
	</button>
{/if}

<style lang="postcss">
	.ds-button {
		@apply relative inline-flex h-8 shrink-0 select-none items-center justify-center whitespace-nowrap rounded-ds border border-transparent px-3 text-body font-medium transition-colors;
	}
	.ds-button.compact {
		@apply h-6 rounded-ds-sm px-2;
	}
	.ds-button.icon-only {
		@apply w-8 px-0;
	}
	.ds-button.compact.icon-only {
		@apply w-6;
	}
	.ds-button-content {
		@apply inline-flex items-center gap-1.5;
	}
	.ds-button-icon {
		@apply inline-flex;
	}
	.ds-button.is-loading .ds-button-content {
		@apply invisible;
	}
	.ds-button-spinner {
		@apply absolute inset-0 flex items-center justify-center;
	}

	.ds-button.default {
		@apply border-line bg-surface text-ink-subtle hover:bg-na-200 hover:text-ink active:bg-na-300;
	}
	.ds-button.primary {
		@apply bg-brand text-ink-inverse hover:bg-brand-hover active:bg-brand-pressed;
	}
	.ds-button.subtle {
		@apply bg-transparent text-ink hover:bg-na-200 active:bg-na-300;
	}
	.ds-button.danger {
		@apply bg-danger-bold text-ink-inverse hover:bg-danger-bold-hover active:bg-danger-bold-pressed;
	}
	.ds-button.warning {
		@apply bg-warning-bold text-ink hover:bg-warning-bold-hover active:bg-warning-bold-pressed;
	}
	.ds-button.link,
	.ds-button.subtle-link {
		@apply h-auto bg-transparent px-0 font-normal hover:underline;
	}
	.ds-button.link {
		@apply text-brand hover:text-brand-hover active:text-brand-pressed;
	}
	.ds-button.subtle-link {
		@apply text-ink-subtle hover:text-ink;
	}

	.ds-button:disabled,
	.ds-button:disabled:hover,
	.ds-button:disabled:active {
		@apply cursor-not-allowed border-transparent bg-na-100 text-ink-disabled;
	}
	.ds-button.link:disabled,
	.ds-button.subtle-link:disabled {
		@apply bg-transparent no-underline;
	}
	/* Keep the button colour while loading so the layout does not flash. */
	.ds-button.is-loading.primary,
	.ds-button.is-loading.primary:disabled {
		@apply bg-brand;
	}
	.ds-button.is-loading.danger,
	.ds-button.is-loading.danger:disabled {
		@apply bg-danger-bold;
	}
	.ds-button.is-loading.default:disabled,
	.ds-button.is-loading.subtle:disabled,
	.ds-button.is-loading.warning:disabled {
		@apply bg-na-200;
	}
	.ds-button.is-loading.default:disabled {
		@apply border-line bg-surface;
	}
</style>
