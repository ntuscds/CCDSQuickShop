<script lang="ts">
	import { getAdminContext } from '../context'
	import StockOpname from '../StockOpname.svelte'

	const admin = getAdminContext()
</script>

{#if admin.period}
	{#key admin.period}
		<StockOpname salePeriod={admin.period} />
	{/key}
{/if}
