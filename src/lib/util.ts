import type { Order } from './api'

const padZero = (s: number) => '0'.repeat(2 - (s + '').length) + s

export const formatDate = (date: Date | null, connector = ' ') => {
	if (!date) return 'N/A'
	const d = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`
	const time = `${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(date.getSeconds())}`
	return `${d}${connector}${time}`
}

// Human-friendly date for display, e.g. "Mon 3 Mar 2026, 10:00".
export const formatFriendlyDate = (date: Date | null, withTime = true) => {
	if (!date) return 'N/A'
	const day = date.toLocaleDateString('en-SG', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	})
	if (!withTime) return day
	const time = date.toLocaleTimeString('en-SG', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	})
	return `${day}, ${time}`
}

export const sortOrder = (orders: Order[]) =>
	orders.sort((a, b) => {
		if (a.collectionTime != b.collectionTime) {
			if (a.collectionTime === null) return -1
			if (b.collectionTime === null) return 1
			return a.collectionTime > b.collectionTime ? -1 : 1
		}
		if (a.salePeriod != b.salePeriod) {
			return a.salePeriod < b.salePeriod ? 1 : -1
		}
		return a.id < b.id ? -1 : 1
	})

// Order IDs (AB1234) and matric numbers (U1234567A) are case-insensitive but
// stored in upper case, so normalise what the user typed.
export const normaliseOrderQuery = (query: string) => {
	const trimmed = query.trim()
	if (/^([A-Za-z]{2}\d{4}|[UuGg]\d{7}[A-Za-z])$/.test(trimmed)) return trimmed.toUpperCase()
	return trimmed
}

export const pluralise = (count: number, singular: string, plural = `${singular}s`) =>
	`${count} ${count === 1 ? singular : plural}`
