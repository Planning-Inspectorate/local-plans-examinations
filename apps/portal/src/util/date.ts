export function formatDisplayDate(date: Date | null | undefined): string | undefined {
	if (!date) {
		return undefined;
	}

	return date.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}
