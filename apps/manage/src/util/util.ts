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
 * Immutably filter the workshops list into workshops to keep and workshops to delete (based on workshopComplete), with the workshop to keep sorted by createdDate
 * Note: Workshops are saved during the workshop journey, but should only be permanent if "submitted" - this function helps to cleanup the workshops if the journey is half-complete
 * @param workshops The workshops to filter and sort
 * @param workshopId If provided, then enforce the element in the sorted workshops at index workshopId to be kept, regardless of whether or not the workshops has been completed
 * @returns Two lists, with the first list being the workshops to keep, and the second list being the workshops to delete
 */
export function sortGateway2Workshops(
	workshops: { createdDate: Date; workshopComplete: boolean; [key: string]: any }[]
) {
	return workshops.toSorted((a, b) => {
		if (!(a.createdDate || b.createdDate)) return 0;
		if (!a.createdDate) return 1;
		if (!b.createdDate) return -1;
		const aCreatedDate = typeof a.createdDate === 'string' ? new Date(a.createdDate) : a.createdDate;
		const bCreatedDate = typeof b.createdDate === 'string' ? new Date(b.createdDate) : b.createdDate;
		return aCreatedDate.getTime() - bCreatedDate.getTime();
	});
}
