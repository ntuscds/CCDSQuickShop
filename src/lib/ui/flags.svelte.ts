// Flags are short-lived notifications shown at the bottom-left of the screen
// (e.g. "Added to cart", "Changes saved").
export type FlagAppearance = 'success' | 'error' | 'warning' | 'information'

export interface FlagAction {
	label: string
	onClick: () => void
}

export interface Flag {
	id: number
	title: string
	description?: string
	appearance: FlagAppearance
	actions?: FlagAction[]
}

let nextID = 0

export const flags = $state<{ list: Flag[] }>({ list: [] })

export const dismissFlag = (id: number) => {
	flags.list = flags.list.filter((x) => x.id !== id)
}

export const addFlag = (flag: Omit<Flag, 'id'> & { timeout?: number }) => {
	const id = ++nextID
	// Informational flags dismiss themselves; errors and warnings stay until dismissed.
	const defaultTimeout = flag.appearance === 'error' || flag.appearance === 'warning' ? 0 : 8000
	const { timeout = defaultTimeout, ...rest } = flag
	flags.list = [...flags.list, { id, ...rest }]
	if (timeout > 0) {
		setTimeout(() => dismissFlag(id), timeout)
	}
	return id
}
