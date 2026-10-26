<script lang="ts">
	import { getAdminContext } from '../context'
	import ProductsSection from '../ProductsSection.svelte'

	const admin = getAdminContext()
</script>

{#if admin.period}
	{#key admin.period}
		<ProductsSection salePeriod={admin.period} />
	{/key}
{/if}
