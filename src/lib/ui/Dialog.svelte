<script lang="ts">
	import type { Snippet } from 'svelte'
	import Button from './Button.svelte'
	import Icon from './Icon.svelte'
	import { uid } from './uid'

	interface Props {
		open: boolean
		title?: string
		children: Snippet
		actions?: Snippet
		width?: 'small' | 'medium' | 'large' | 'xlarge'
		// Renders only the content without header and padding (used for images).
		plain?: boolean
		onclose?: () => void
		class?: string
	}
	let {
		open = $bindable(false),
		title,
		children,
		actions,
		width = 'medium',
		plain = false,
		onclose,
		class: klass = ''
	}: Props = $props()

	// The native <dialog> element provides the focus trap, Escape handling and
	// focus restoration.
	let dialog: HTMLDialogElement | undefined = $state()
	const titleId = uid('dialog-title')

	$effect(() => {
		if (!dialog) return
		if (open && !dialog.open) dialog.showModal()
		else if (!open && dialog.open) dialog.close()
	})

	const close = () => {
		if (!open) return
		open = false
		onclose?.()
	}
	// Clicking the backdrop (the dialog element itself, outside its content) closes it.
	$effect(() => {
		const el = dialog
		if (!el) return
		const onBackdropClick = (e: MouseEvent) => {
			if (e.target === el) close()
		}
		el.addEventListener('click', onBackdropClick)
		return () => el.removeEventListener('click', onBackdropClick)
	})
</script>

<dialog
	bind:this={dialog}
	class="ds-dialog {width} {klass}"
	class:plain
	aria-labelledby={title ? titleId : undefined}
	onclose={close}
>
	{#if open}
		<div class="ds-dialog-inner">
			{#if !plain}
				<header class="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
					<h2 id={titleId} class="text-h3">{title}</h2>
					<Button appearance="subtle" iconOnly label="Close" onClick={close}>
						<Icon name="x" class="size-5" />
					</Button>
				</header>
			{/if}
			<div class="ds-dialog-body" class:px-6={!plain} class:py-2={!plain}>
				{@render children()}
			</div>
			{#if actions}
				<footer class="flex flex-wrap justify-end gap-2 px-6 pb-6 pt-4">{@render actions()}</footer>
			{/if}
		</div>
	{/if}
</dialog>

<style lang="postcss">
	.ds-dialog {
		@apply m-auto w-[calc(100%-32px)] rounded-ds-xl bg-surface-overlay p-0 text-ink shadow-overlay;
		max-height: calc(100% - 32px);
	}
	.ds-dialog::backdrop {
		background: rgba(9, 30, 66, 0.54);
	}
	.ds-dialog.small {
		@apply max-w-[400px];
	}
	.ds-dialog.medium {
		@apply max-w-[600px];
	}
	.ds-dialog.large {
		@apply max-w-[800px];
	}
	.ds-dialog.xlarge {
		@apply max-w-[968px];
	}
	.ds-dialog.plain {
		@apply bg-transparent shadow-none;
	}
	.ds-dialog-inner {
		@apply flex flex-col;
		max-height: calc(100vh - 32px);
	}
	.ds-dialog-body {
		@apply min-h-0 flex-1 overflow-y-auto;
	}
</style>
