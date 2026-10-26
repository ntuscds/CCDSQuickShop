<script lang="ts">
	import api from '$lib/api'
	import Button from '$lib/ui/Button.svelte'
	import ErrorBoundary from '$lib/ui/ErrorBoundary.svelte'
	import Icon from '$lib/ui/Icon.svelte'
	import TextField from '$lib/ui/TextField.svelte'

	interface Props {
		label: string
		value?: string
		// Keep the original aspect ratio instead of cropping to a square.
		raw?: boolean
		helper?: string
	}
	let { label, value = $bindable(''), raw = false, helper }: Props = $props()

	let fileInput: HTMLInputElement | undefined = $state()
	let uploading = $state(false)
	let uploadError: unknown = $state()

	const onFileChange = async () => {
		const file = fileInput?.files?.[0]
		if (!file) return
		uploading = true
		uploadError = undefined
		try {
			value = await api.admin.uploadImage(file, raw)
		} catch (e) {
			uploadError = e
		} finally {
			uploading = false
			if (fileInput) fileInput.value = ''
		}
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-start gap-3">
		{#if value}
			<img src={value} alt="" class="size-16 shrink-0 rounded-ds border border-line object-cover" />
		{:else}
			<span
				class="flex size-16 shrink-0 items-center justify-center rounded-ds border border-dashed border-line-bold text-ink-subtlest"
			>
				<Icon name="photo" class="size-6" />
			</span>
		{/if}
		<div class="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end">
			<TextField {label} bind:value {helper} placeholder="https://…" class="flex-1" compact />
			<Button onClick={() => fileInput?.click()} loading={uploading} spacing="compact">
				{#snippet iconBefore()}<Icon name="arrow-up-tray" class="size-4" />{/snippet}
				Upload image
			</Button>
		</div>
	</div>
	<ErrorBoundary error={uploadError} title="Upload failed" />
	<input
		type="file"
		accept="image/*"
		class="hidden"
		bind:this={fileInput}
		onchange={onFileChange}
	/>
</div>
