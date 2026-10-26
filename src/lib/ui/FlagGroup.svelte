<script lang="ts">
	import { fly } from 'svelte/transition'
	import { flags, dismissFlag } from './flags.svelte'
	import Button from './Button.svelte'
	import Icon from './Icon.svelte'

	const icons = {
		success: 'check-circle',
		error: 'x-circle',
		warning: 'exclamation-triangle',
		information: 'information-circle'
	} as const
	const labels = {
		success: 'Success',
		error: 'Error',
		warning: 'Warning',
		information: 'Information'
	} as const
</script>

<div
	class="ds-flag-group pointer-events-none fixed left-4 z-50 flex w-[calc(100%-32px)] max-w-[400px] flex-col-reverse gap-2 sm:left-12"
	aria-live="polite"
>
	{#each flags.list as flag (flag.id)}
		<div
			class="ds-flag pointer-events-auto flex gap-3 rounded-ds-lg border border-line bg-surface-overlay p-4 shadow-overlay"
			role="status"
			transition:fly={{ y: 16, duration: 200 }}
		>
			<span class="ds-flag-icon {flag.appearance}">
				<Icon name={icons[flag.appearance]} class="size-6" label={labels[flag.appearance]} />
			</span>
			<div class="flex min-w-0 flex-1 flex-col gap-1">
				<p class="text-h5 leading-5">{flag.title}</p>
				{#if flag.description}<p class="text-ink-subtle">{flag.description}</p>{/if}
				{#if flag.actions?.length}
					<div class="mt-1 flex flex-wrap gap-x-4">
						{#each flag.actions as action}
							<Button
								appearance="link"
								onClick={() => {
									action.onClick()
									dismissFlag(flag.id)
								}}
							>
								{action.label}
							</Button>
						{/each}
					</div>
				{/if}
			</div>
			<Button
				appearance="subtle"
				spacing="compact"
				iconOnly
				label="Dismiss"
				class="-mr-2 -mt-2"
				onClick={() => dismissFlag(flag.id)}
			>
				<Icon name="x" class="size-4" />
			</Button>
		</div>
	{/each}
</div>

<style lang="postcss">
	/* Pages with a fixed bottom bar raise the flags by setting --ds-flag-offset. */
	.ds-flag-group {
		bottom: var(--ds-flag-offset, 1rem);
	}
	@media (min-width: 640px) {
		.ds-flag-group {
			bottom: var(--ds-flag-offset, 3rem);
		}
	}
	.ds-flag-icon {
		@apply flex shrink-0;
	}
	.ds-flag-icon.success {
		@apply text-success;
	}
	.ds-flag-icon.error {
		@apply text-danger;
	}
	.ds-flag-icon.warning {
		@apply text-warning;
	}
	.ds-flag-icon.information {
		@apply text-info;
	}
</style>
