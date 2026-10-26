<script lang="ts">
	import type { Snippet } from 'svelte'
	import Icon from './Icon.svelte'

	type Appearance = 'information' | 'warning' | 'error' | 'success' | 'discovery'
	interface Props {
		appearance?: Appearance
		title?: string
		children: Snippet
		actions?: Snippet
		class?: string
	}
	const {
		appearance = 'information',
		title,
		children,
		actions,
		class: klass = ''
	}: Props = $props()

	// Each appearance has an icon so that the meaning does not rely on colour alone.
	const icons = {
		information: 'information-circle',
		warning: 'exclamation-triangle',
		error: 'x-circle',
		success: 'check-circle',
		discovery: 'sparkles'
	} as const
	const labels = {
		information: 'Information',
		warning: 'Warning',
		error: 'Error',
		success: 'Success',
		discovery: 'Tip'
	} as const
</script>

<div
	class="ds-section-message {appearance} {klass}"
	role={appearance === 'error' ? 'alert' : 'status'}
>
	<span class="ds-section-message-icon">
		<Icon name={icons[appearance]} class="size-6" label={labels[appearance]} />
	</span>
	<div class="flex min-w-0 flex-1 flex-col gap-2">
		{#if title}<p class="text-h4">{title}</p>{/if}
		<div class="text-body [overflow-wrap:anywhere]">{@render children()}</div>
		{#if actions}
			<div class="flex flex-wrap items-center gap-x-4 gap-y-1">{@render actions()}</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	.ds-section-message {
		@apply flex gap-4 rounded-ds-lg p-4 text-ink;
	}
	.ds-section-message-icon {
		@apply flex shrink-0;
	}
	.information {
		@apply bg-info-subtle;
	}
	.information .ds-section-message-icon {
		@apply text-info;
	}
	.warning {
		@apply bg-warning-subtle;
	}
	.warning .ds-section-message-icon {
		@apply text-warning;
	}
	.error {
		@apply bg-danger-subtle;
	}
	.error .ds-section-message-icon {
		@apply text-danger;
	}
	.success {
		@apply bg-success-subtle;
	}
	.success .ds-section-message-icon {
		@apply text-success;
	}
	.discovery {
		@apply bg-discovery-subtle;
	}
	.discovery .ds-section-message-icon {
		@apply text-discovery;
	}
</style>
