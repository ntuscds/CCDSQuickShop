import { redirect } from '@sveltejs/kit'
import type { PageLoad } from './$types'

// The admin console opens on the collection page, its most frequent task.
export const load: PageLoad = () => {
	redirect(307, '/admin/collect')
}
