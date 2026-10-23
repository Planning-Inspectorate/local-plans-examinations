import type { ManageService } from '#service';

/**
 * Immutably sort the given list submission details, with null completionDate values at the end
 * @returns The sorted dates, with undefined/null completionDate values at the end
 * @param submissions
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

export type examinationStatusWithPause = {
	id: string | null;
	examiningInspector1: string | null;
	examiningInspector2: string | null;
	examiningInspector3: string | null;
	QADate: Date | null;
	qaInspector1: string | null;
	qaInspector2: string | null;
	qaInspector3: string | null;
	panelResponseToInspectorDate: Date | null;
	planPauseStartDate: Date | null;
	planPauseEndDate: Date | null;
	finalReportIssueDate: Date | null;
	adoptionDate: Date | null;
	planPauseHistory: { planPauseDate: Date | null }[];
	shouldPause?: boolean;
};
export const getExaminationStages = async (service: ManageService, caseId: string) => {
	const examinationStatus: examinationStatusWithPause | null = await service.db.examinationInfo.findFirst({
		where: { caseId },
		select: {
			id: true,
			examiningInspector1: true,
			examiningInspector2: true,
			examiningInspector3: true,
			QADate: true,
			qaInspector1: true,
			qaInspector2: true,
			qaInspector3: true,
			panelResponseToInspectorDate: true,
			planPauseStartDate: true,
			planPauseEndDate: true,
			finalReportIssueDate: true,
			adoptionDate: true,
			planPauseHistory: {
				orderBy: { createdAt: 'desc' },
				take: 1,
				select: { planPauseDate: true }
			}
		}
	});

	if (examinationStatus !== null) {
		const latestStart = examinationStatus.planPauseHistory[0]?.planPauseDate ?? examinationStatus.planPauseStartDate;
		const end = examinationStatus.planPauseEndDate;
		examinationStatus.shouldPause = !!latestStart && (!end || latestStart > end);

		return examinationStatus;
	}
};
/**
 * Immutably sort the given list workshops or hearings. details, with null createdDate values at the end
 * @param workshops The workshops to filter and sort
 * @param hearings The workshops to filter and sort
 * @returns The sorted workshops or hearings
 */
export function sortByCreatedDate(workshops: { createdDate: Date; [key: string]: any }[]) {
	return workshops.toSorted((a, b) => {
		if (!(a.createdDate || b.createdDate)) return 0;
		if (!a.createdDate) return 1;
		if (!b.createdDate) return -1;
		const aCreatedDate = typeof a.createdDate === 'string' ? new Date(a.createdDate) : a.createdDate;
		const bCreatedDate = typeof b.createdDate === 'string' ? new Date(b.createdDate) : b.createdDate;
		return aCreatedDate.getTime() - bCreatedDate.getTime();
	});
}
