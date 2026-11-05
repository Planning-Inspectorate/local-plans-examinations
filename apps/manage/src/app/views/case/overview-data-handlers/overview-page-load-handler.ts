import type { Request, Response, NextFunction } from 'express';
import type { ManageService } from '#service';
import type { PlanPauseHistory } from '@pins/local-plans-database/src/client/client.ts';
import { sortByDateColumn } from '#util/util.ts';
import { pushAlertToSession } from '../../../util/alert.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { setVirusScanViewLocals } from '@pins/local-plans-lib/forms/custom-components/file-uploader/virus-scan.ts';
import { journeyFileUploadQuestionConfigs } from '../controller.ts';

export interface PageLoadContext {
	req: Request;
	res: Response;
	next: NextFunction | undefined;
	service: ManageService;
	journeyId: string;
	reference: string;
	caseRecord: { id: string; planTitle: string | null };
}

export abstract class OverviewPageLoadHandler {
	public abstract handle(context: PageLoadContext): Promise<void>;
	protected async tryAddPauseStatusBanner(
		context: PageLoadContext,
		preFetchedExamData?: { planPauseHistory: PlanPauseHistory[] }
	) {
		const { req, service, caseRecord } = context;
		if (req.method != 'GET') {
			return;
		}
		let examData: { planPauseHistory: PlanPauseHistory[] };
		if (preFetchedExamData) {
			examData = preFetchedExamData;
		} else {
			const { db } = service;
			const fetchedExamData = await db.examinationInfo.findUnique({
				select: {
					planPauseHistory: true
				},
				where: { caseId: caseRecord.id }
			});
			if (!fetchedExamData) {
				throw Error(`Could not fetch exam data for case '${caseRecord}'`);
			}
			examData = fetchedExamData;
		}
		const sortedPauseData = sortByDateColumn(examData?.planPauseHistory ? examData?.planPauseHistory : [], 'createdAt');
		if (OverviewPageLoadHandler.isCaseCurrentlyPaused(sortedPauseData as PlanPauseHistory[])) {
			const caseReference = String(req.params.reference);
			const examJourneyUrl = `/case/${encodeURIComponent(caseReference)}/${COMMON_CONSTS.EXAMINATION_JOURNEY_ID}`;
			pushAlertToSession(
				req,
				'important',
				'This examination is paused',
				`<a href="${examJourneyUrl}">View details</a>`
			);
		}
	}
	/**
	 * Return true if there are any pauses that overlap with the current datetime
	 * @param pauses The list of pauses from the database
	 * @returns True if there is an overlap, false otherwise
	 */
	public static isCaseCurrentlyPaused(pauses: PlanPauseHistory[]) {
		const currentTime = new Date();
		for (const pause of pauses) {
			const indefinitelyPaused = !pause.planPauseEndDate;
			if (
				currentTime >= pause.planPauseDate &&
				(indefinitelyPaused || (pause.planPauseEndDate && currentTime <= pause.planPauseEndDate))
			) {
				return true;
			}
		}
		return false;
	}
	protected addVirusScanStatusToLocals(req: Request, res: Response, journeyId: string) {
		if (req.method === 'GET') {
			setVirusScanViewLocals(
				res,
				journeyFileUploadQuestionConfigs[journeyId].map((elem) => elem.fieldName)
			);
		}
	}
}
