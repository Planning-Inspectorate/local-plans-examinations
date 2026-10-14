import type { ManageService } from '#service';

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


export const getExaminationStages = async (service: ManageService, caseId: string) => {
	const examinationStatus = await service.db.examinationInfo.findFirst({
		where: { caseId },
		select: {
			examiningInspector1: true,
			examiningInspector2: true,
			examiningInspector3: true,
			qaInspector1: true,
			qaInspector2: true,
			qaInspector3: true,
			panelResponseToInspectorDate: true,
			planPauseStartDate: true,
			planPauseEndDate: true,
			finalReportIssueDate: true,
			adoptionDate: true
		}
	});
	if(examinationStatus !== null) {
		return examinationStatus;
	}

};