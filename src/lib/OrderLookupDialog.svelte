<script lang="ts">
	import Dialog from '$lib/ui/Dialog.svelte'
	import OrderLookupForm from './OrderLookupForm.svelte'

	interface Props {
		open: boolean
	}
	let { open = $bindable(false) }: Props = $props()
</script>

<Dialog bind:open title="Find my order" width="small">
	<p class="mb-4 text-ink-subtle">Look up the status of an order and its collection details.</p>
	<div class="pb-4">
		<OrderLookupForm autofocus />
	</div>
</Dialog>
