/**
 * Immutably sort the given list submission details, with null completionDate values at the end
 * @param dates The submissions to sort
 * @returns The sorted dates, with undefined/null completionDate values at the end
 */
export function sortGateway3Submissions(
	submissions: { id: string; decision: string | null; completionDate: Date | null; gateway3InfoId: string | null }[]
) {
	if (submissions === null || submissions == undefined) {
		throw Error('Provided submissions list is null or undefined');
	}
	return submissions.toSorted((a, b) => {
		if (!(a.completionDate || b.completionDate)) return 0;
		if (!a.completionDate) return 1;
		if (!b.completionDate) return -1;
		return a.completionDate.getTime() - b.completionDate.getTime();
	});
}
