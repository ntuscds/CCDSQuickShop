<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		// Appearance names follow ADS: `removed` = red, `inprogress` = teal,
		// `new` = purple, `moved` = yellow.
		appearance?: 'default' | 'success' | 'removed' | 'inprogress' | 'new' | 'moved'
		bold?: boolean
		children: Snippet
		class?: string
	}
	const { appearance = 'default', bold = false, children, class: klass = '' }: Props = $props()
</script>

<span class="ds-lozenge {appearance} {klass}" class:bold>{@render children()}</span>

<style lang="postcss">
	.ds-lozenge {
		@apply inline-flex h-5 max-w-48 shrink-0 items-center truncate rounded-ds-sm px-1 align-middle text-small font-medium;
	}
	.default {
		@apply bg-na-200 text-ink;
	}
	.default.bold {
		@apply bg-n-800 text-ink-inverse;
	}
	.success {
		@apply bg-[#D3F1A7] text-[#37471F];
	}
	.success.bold {
		@apply bg-success-bold text-ink-inverse;
	}
	.removed {
		@apply bg-[#FFD5D2] text-[#5D1F1A];
	}
	.removed.bold {
		@apply bg-danger-bold text-ink-inverse;
	}
	.inprogress {
		@apply bg-[#C6EDFB] text-[#164555];
	}
	.inprogress.bold {
		@apply bg-info-bold text-ink-inverse;
	}
	.new {
		@apply bg-[#EED7FC] text-[#48245D];
	}
	.new.bold {
		@apply bg-discovery-bold text-ink-inverse;
	}
	.moved {
		@apply bg-[#FCE4A6] text-[#693200];
	}
	.moved.bold {
		@apply bg-warning-bold text-ink;
	}
</style>
