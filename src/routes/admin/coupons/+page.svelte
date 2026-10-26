<script lang="ts">
	import { getAdminContext } from '../context'
	import CouponsSection from '../CouponsSection.svelte'

	const admin = getAdminContext()
</script>

{#if admin.period}
	{#key admin.period}
		<CouponsSection salePeriod={admin.period} />
	{/key}
{/if}
