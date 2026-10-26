<script lang="ts">
	import Button from './Button.svelte'
	import Dialog from './Dialog.svelte'
	import ErrorBoundary from './ErrorBoundary.svelte'

	interface Props {
		open: boolean
		title: string
		message: string
		confirmLabel?: string
		cancelLabel?: string
		appearance?: 'danger' | 'primary' | 'warning'
		onConfirm: () => unknown
		// Called when the dialog is dismissed without confirming.
		onCancel?: () => void
	}
	let {
		open = $bindable(false),
		title,
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		appearance = 'danger',
		onConfirm,
		onCancel
	}: Props = $props()

	let error: unknown = $state()
	let confirmed = false
	const confirm = async () => {
		error = undefined
		try {
			await onConfirm()
			confirmed = true
			open = false
		} catch (e) {
			error = e
		}
	}
	const onClose = () => {
		error = undefined
		if (!confirmed) onCancel?.()
		confirmed = false
	}
</script>

<Dialog bind:open {title} width="small" onclose={onClose}>
	<p>{message}</p>
	<div class="mt-2"><ErrorBoundary {error} /></div>
	{#snippet actions()}
		<Button appearance="subtle" onClick={() => (open = false)}>{cancelLabel}</Button>
		<Button {appearance} onClick={confirm}>{confirmLabel}</Button>
	{/snippet}
</Dialog>
