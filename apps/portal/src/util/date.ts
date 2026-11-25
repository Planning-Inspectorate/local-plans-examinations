export function formatDisplayDate(date: Date | null | undefined): string | undefined {
	if (!date) {
		return undefined;
	}

	return date.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		timeZone: 'Europe/London',
		year: 'numeric'
	});
}

export function formatDisplayTime(date: Date, timeZone: string = 'Europe/London', hour12: boolean = false): string {
	return date.toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: hour12,
		timeZone: timeZone
	});
}
