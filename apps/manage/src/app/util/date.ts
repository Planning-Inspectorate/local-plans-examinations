import { fromZonedTime } from 'date-fns-tz';

export function parseDate(value: string): Date {
	const [dayStr, monthStr, yearStr] = value.split('/');
	const day = Number(dayStr);
	const month = Number(monthStr);
	const year = Number(yearStr);
	const hour = 0;
	const minute = 0;

	const dateStr = `${year}-${pad(month)}-${pad(day)}`;
	const timeStr = `${pad(hour)}:${pad(minute)}`;

	const date = fromZonedTime(`${dateStr} ${timeStr}`, 'Europe/London');

	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
		throw new Error(`Invalid date: ${value}`);
	}
	return date;
}

function pad(num: any, length = 2) {
	return num.toString().padStart(length, '0');
}
