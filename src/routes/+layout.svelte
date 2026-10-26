<script lang="ts">
	import '../app.css'
	import FlagGroup from '$lib/ui/FlagGroup.svelte'

	let { children } = $props()
</script>

<a href="#main" class="skip-link">Skip to main content</a>
{@render children()}
<FlagGroup />

<style lang="postcss">
	.skip-link {
		@apply sr-only;
	}
	.skip-link:focus {
		@apply not-sr-only fixed left-4 top-4 z-50 rounded-ds bg-surface px-4 py-2 text-body font-medium text-brand shadow-overlay;
	}
</style>
