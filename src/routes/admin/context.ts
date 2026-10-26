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

// The sale period the storefront shows. Mirrors the backend, which compares
// start times against today's date (UTC): a period counts once its start
// date is before today.
export const currentPeriodID = (periods: SalePeriod[]): string | undefined => {
	const today = new Date()
	const startOfTodayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
	const started = periods
		.filter((p) => p.start_time.getTime() < startOfTodayUTC)
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
