<script lang="ts">
	import type { SummaryEntry } from '$lib/api'
	import { constructTables } from './summary'

	interface Props {
		entries: SummaryEntry[]
		searchOrder?: (phrase: string) => void
	}
	const { entries, searchOrder }: Props = $props()

	const search = (label: string) => () => searchOrder?.(label)
	const tables = $derived(constructTables(entries))
</script>

{#each tables as tbl}
	<h3 class="mt-4 text-lg">{tbl.name}</h3>
	<table>
		{#if tbl.columns}
			<thead>
				{#each tbl.columns as colRow}
					<tr>
						<th></th>
						{#each colRow as col}
							<th colspan={col.span}>{col.label}</th>
						{/each}
					</tr>
				{/each}
			</thead>
		{/if}
		<tbody>
			{#each tbl.rows as row}
				<tr>
					<td class="font-bold">{row.label}</td>
					{#each row.data as num, i}
						<td onclick={search(row.fullLabels[i])}>
							{#if num}{num}{:else}-{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
{/each}

<style lang="postcss">
	table {
		@apply w-fit;
	}
	td,
	th {
		@apply border border-black px-2 text-center;
	}
	tbody tr:nth-child(2n + 1) {
		@apply bg-gray-300;
	}
</style>
