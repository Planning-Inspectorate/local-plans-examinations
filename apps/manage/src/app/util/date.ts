export function parseDate(value: string): Date {
	const [dayStr, monthStr, yearStr] = value.split('/');
	const day = Number(dayStr);
	const month = Number(monthStr);
	const year = Number(yearStr);

	const date = new Date(Date.UTC(year, month - 1, day));

	if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
		throw new Error(`Invalid date: ${value}`);
	}

	return date;
}
