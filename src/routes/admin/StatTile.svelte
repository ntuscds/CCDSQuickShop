<script lang="ts">
	interface Props {
		label: string
		value: string | number
		hint?: string
	}
	const { label, value, hint }: Props = $props()
</script>

<div class="rounded-ds-lg border border-line bg-surface-raised p-4 shadow-raised">
	<p class="text-small font-semibold text-ink-subtle">{label}</p>
	<p class="mt-1 text-h2 tabular-nums">{value}</p>
	{#if hint}<p class="mt-1 text-small text-ink-subtlest">{hint}</p>{/if}
</div>
