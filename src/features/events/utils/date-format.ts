const EVENT_LOCALE = 'es-CO'

function toDate(value: string): Date {
	return new Date(value)
}

function isSameCalendarDay(start: Date, end: Date): boolean {
	return (
		start.getFullYear() === end.getFullYear() &&
		start.getMonth() === end.getMonth() &&
		start.getDate() === end.getDate()
	)
}

export function formatEventDate(value: string): string {
	return new Intl.DateTimeFormat(EVENT_LOCALE, {
		weekday: 'short',
		day: 'numeric',
		month: 'long',
	}).format(toDate(value))
}

export function formatEventTime(value: string): string {
	return new Intl.DateTimeFormat(EVENT_LOCALE, {
		hour: '2-digit',
		minute: '2-digit',
	}).format(toDate(value))
}

export function formatEventDateTime(value: string): string {
	return new Intl.DateTimeFormat(EVENT_LOCALE, {
		weekday: 'short',
		day: 'numeric',
		month: 'long',
		hour: '2-digit',
		minute: '2-digit',
	}).format(toDate(value))
}

export function formatEventDateRange(start: string, end?: string): string {
	const startDate = toDate(start)

	if (!end) {
		return formatEventDateTime(start)
	}

	const endDate = toDate(end)

	if (isSameCalendarDay(startDate, endDate)) {
		return `${formatEventDateTime(start)} - ${formatEventTime(end)}`
	}

	return `${formatEventDateTime(start)} - ${formatEventDateTime(end)}`
}

export function isMultiDayEvent(start: string, end?: string): boolean {
	if (!end) {
		return false
	}

	return !isSameCalendarDay(toDate(start), toDate(end))
}
