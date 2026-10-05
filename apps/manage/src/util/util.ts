/**
 * Immutably sort the given list submission details, with null completionDate values at the end
 * @param dates The submissions to sort
 * @returns The sorted dates, with undefined/null completionDate values at the end
 */
export function sortGateway3Submissions(
	submissions: { id: string; decision: string | null; completionDate: Date | null; gateway3InfoId: string | null }[]
) {
	return submissions.toSorted((a, b) => {
		if (!(a.completionDate || b.completionDate)) return 0;
		if (!a.completionDate) return 1;
		if (!b.completionDate) return -1;
		return a.completionDate.getTime() - b.completionDate.getTime();
	});
}

/**
 * Immutably sort the given list workshops details, with null createdDate values at the end
 * @param workshops The workshops to filter and sort
 * @returns The sorted workshops
 */
export function sortGateway2Workshops(workshops: { createdDate: Date; [key: string]: any }[]) {
	return workshops.toSorted((a, b) => {
		if (!(a.createdDate || b.createdDate)) return 0;
		if (!a.createdDate) return 1;
		if (!b.createdDate) return -1;
		const aCreatedDate = typeof a.createdDate === 'string' ? new Date(a.createdDate) : a.createdDate;
		const bCreatedDate = typeof b.createdDate === 'string' ? new Date(b.createdDate) : b.createdDate;
		return aCreatedDate.getTime() - bCreatedDate.getTime();
	});
}
