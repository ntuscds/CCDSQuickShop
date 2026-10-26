<script lang="ts">
	import type { Snippet } from 'svelte'
	import { beforeNavigate } from '$app/navigation'
	import Breadcrumbs from '$lib/ui/Breadcrumbs.svelte'
	import Button from '$lib/ui/Button.svelte'
	import ErrorBoundary from '$lib/ui/ErrorBoundary.svelte'
	import Lozenge from '$lib/ui/Lozenge.svelte'

	// Frame for list -> detail editing: breadcrumb back to the list, the form,
	// and a sticky footer with Save/Cancel. Guards against losing unsaved changes.
	interface Props {
		listLabel: string
		title: string
		dirty: boolean
		saving?: boolean
		error?: unknown
		saveLabel?: string
		onSave: () => unknown
		onCancel: () => void
		secondaryActions?: Snippet
		children: Snippet
	}
	const {
		listLabel,
		title,
		dirty,
		saving = false,
		error,
		saveLabel = 'Save',
		onSave,
		onCancel,
		secondaryActions,
		children
	}: Props = $props()

	const DISCARD_PROMPT = 'You have unsaved changes. Discard them?'
	beforeNavigate((nav) => {
		if (dirty && !window.confirm(DISCARD_PROMPT)) nav.cancel()
	})
	const cancel = () => {
		if (dirty && !window.confirm(DISCARD_PROMPT)) return
		onCancel()
	}
	const onBeforeUnload = (e: BeforeUnloadEvent) => {
		if (!dirty) return
		e.preventDefault()
		e.returnValue = ''
	}
</script>

<svelte:window onbeforeunload={onBeforeUnload} />

<div class="flex flex-col gap-4">
	<div class="flex flex-col gap-2">
		<Breadcrumbs items={[{ label: listLabel, onClick: cancel }, { label: title }]} />
		<h1 class="text-h2 md:text-h1">{title}</h1>
	</div>
	<ErrorBoundary {error} title="Could not save" />
	<form
		class="flex flex-col gap-4"
		novalidate
		onsubmit={(e) => {
			e.preventDefault()
			onSave()
		}}
	>
		{@render children()}
		<div class="ds-editor-footer">
			<div class="flex flex-wrap items-center gap-2">
				<Button appearance="primary" type="submit" loading={saving}>{saveLabel}</Button>
				<Button appearance="subtle" onClick={cancel}>Cancel</Button>
				{#if dirty}<Lozenge appearance="moved">Unsaved changes</Lozenge>{/if}
			</div>
			<div class="flex flex-wrap items-center gap-2">{@render secondaryActions?.()}</div>
		</div>
	</form>
</div>

<style lang="postcss">
	.ds-editor-footer {
		@apply sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface px-4 py-3 md:-mx-6 md:px-6;
	}
</style>
