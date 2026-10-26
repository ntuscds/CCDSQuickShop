<script lang="ts">
	import type { SummaryEntry } from '$lib/api'
	import { pluralise } from '$lib/util'
	import { constructTables } from './summary'

	interface Props {
		entries: SummaryEntry[]
		// Called with "Product, Variant" when a count is clicked.
		onSelect?: (phrase: string) => void
	}
	const { entries, onSelect }: Props = $props()

	const tables = $derived(constructTables(entries))
	const total = (rows: { data: number[] }[]) =>
		rows.reduce((acc, row) => acc + row.data.reduce((a, b) => a + b, 0), 0)
</script>

{#each tables as tbl (tbl.name)}
	<div class="ds-table-wrap rounded-ds-lg border border-line bg-surface-raised px-2 pb-2">
		<table class="ds-table ds-matrix">
			<caption class="px-2 py-3 text-left text-h5">
				{tbl.name}
				<span class="font-normal text-ink-subtle">· {pluralise(total(tbl.rows), 'item')}</span>
			</caption>
			{#if tbl.columns}
				<thead>
					{#each tbl.columns as colRow}
						<tr>
							<th scope="col" class="ds-matrix-sticky"></th>
							{#each colRow as col}
								<th scope="col" colspan={col.span} class="text-center">{col.label}</th>
							{/each}
						</tr>
					{/each}
				</thead>
			{/if}
			<tbody>
				{#each tbl.rows as row (row.label)}
					<tr>
						<th
							scope="row"
							class="ds-matrix-sticky whitespace-nowrap text-left text-body font-semibold text-ink"
						>
							{row.label}
						</th>
						{#each row.data as num, i}
							<td class="text-center tabular-nums">
								{#if num}
									{#if onSelect}
										<button
											type="button"
											class="ds-link rounded-ds px-1"
											onclick={() => onSelect(row.fullLabels[i])}
											aria-label={`View orders for ${row.fullLabels[i]} (${pluralise(num, 'item')})`}
										>
											{num}
										</button>
									{:else}
										{num}
									{/if}
								{:else}
									<span class="text-ink-disabled" aria-label="none">–</span>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/each}

<style lang="postcss">
	/* Matrices are as wide as their columns, not the page. */
	.ds-matrix {
		@apply w-auto min-w-80;
	}
	.ds-matrix :global(td),
	.ds-matrix :global(th) {
		@apply px-4;
	}
	.ds-matrix-sticky {
		@apply sticky left-0 bg-surface-raised;
	}
</style>
