<script lang="ts">
	import { getAdminContext } from '../context'
	import OrderSummaryView from '../OrderSummaryView.svelte'

	const admin = getAdminContext()
</script>

{#if admin.period}
	{#key admin.period}
		<OrderSummaryView salePeriod={admin.period} />
	{/key}
{/if}
