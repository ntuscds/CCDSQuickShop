import { getContext, setContext } from 'svelte'
import type { SalePeriod } from '$lib/api'

// Shared state of the admin console, provided by the admin layout.
export interface AdminState {
	periods: SalePeriod[]
	// ID of the sale period that the sale-scoped pages operate on.
	period: string
	loading: boolean
	error: unknown
	reloadPeriods: () => Promise<void>
}

const KEY = Symbol('admin')
export const setAdminContext = (state: AdminState) => setContext(KEY, state)
export const getAdminContext = () => getContext<AdminState>(KEY)

// The sale period the storefront shows: the latest one that has started.
export const currentPeriodID = (periods: SalePeriod[]): string | undefined => {
	const now = Date.now()
	const started = periods
		.filter((p) => p.start_time.getTime() <= now)
		.sort((a, b) => b.start_time.getTime() - a.start_time.getTime())
	return (started[0] ?? periods[periods.length - 1])?.id
}

export const periodStatus = (
	period: SalePeriod,
	periods: SalePeriod[]
): 'current' | 'upcoming' | 'past' => {
	if (period.id === currentPeriodID(periods)) return 'current'
	return period.start_time.getTime() > Date.now() ? 'upcoming' : 'past'
}

// Pages whose content depends on the selected sale period.
export const PERIOD_SCOPED_PATHS = [
	'/admin/products',
	'/admin/coupons',
	'/admin/summary',
	'/admin/collections',
	'/admin/stock'
]
