<script lang="ts">
	import { getAdminContext } from '../context'
	import CollectionSummaryView from '../CollectionSummaryView.svelte'

	const admin = getAdminContext()
</script>

{#if admin.period}
	{#key admin.period}
		<CollectionSummaryView salePeriod={admin.period} />
	{/key}
{/if}
