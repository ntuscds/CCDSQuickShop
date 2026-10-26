<script lang="ts">
	import type { Snippet } from 'svelte'
	import { ZodError } from 'zod'
	import { page } from '$app/stores'
	import SectionMessage from './SectionMessage.svelte'

	interface Props {
		error: unknown
		title?: string
		children?: Snippet
	}
	const { children, error, title }: Props = $props()

	const technicalMessage = $derived.by(() => {
		if (!error) return
		if (error instanceof Error) {
			return `${error.name}: ${error.message}\n${error.stack}`
		}
		return `${error}`
	})
	const errorMessage = $derived.by(() => {
		if (!error) return
		if (error instanceof ZodError) {
			console.error('Validation error:', error)
			return 'The server returned an unexpected response. Try refreshing.'
		}
		const isNetworkError =
			error instanceof Error &&
			(error.name === 'NetworkError' ||
				(error.name === 'TypeError' && error.message.includes('NetworkError')) ||
				error.message.includes('Failed to fetch'))
		if (isNetworkError) {
			console.error('Network error:', error)
			return 'Failed to contact the server. Check your connection and try again.'
		}
		console.error('Error:', error)
		return 'Something went wrong. Try again later.'
	})

	const emailTitle = encodeURIComponent('[Merch Shop] Error Reporting')
	const emailContent = $derived.by(() => {
		const msg = `[Please enter steps you have taken to see the error.]\n\nTechnical Details:\nCurrent Page: ${$page.url.pathname}\n${technicalMessage}`
		return encodeURIComponent(msg.replaceAll('\n', '\r\n'))
	})
</script>

{#if errorMessage}
	<SectionMessage appearance="error" {title}>
		{errorMessage}
		{#snippet actions()}
			<a
				href={`mailto:scds-business@e.ntu.edu.sg?subject=${emailTitle}&body=${emailContent}`}
				class="ds-link"
			>
				Need more help?
			</a>
		{/snippet}
	</SectionMessage>
{:else if children}
	{@render children()}
{/if}
