import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { formatValue } from '../../../util/util.ts';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/case.ts';
import { sortByDateColumn } from '../../../../util/util.ts';

export class TimetableTabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { res, next, service, journeyId, caseRecord } = context;
		const { db } = service;

		const gateway1Data = await db.gateway1Info.findUnique({
			where: { caseId: caseRecord.id }
		});
		const gateway2Data = await db.gateway2Info.findUnique({
			where: { caseId: caseRecord.id },
			include: { workshops: true }
		});
		const gateway3Data = await db.gateway3Info.findUnique({
			where: { caseId: caseRecord.id },
			include: { submissions: true }
		});
		const examinationData = await db.examinationInfo.findUnique({
			where: { caseId: caseRecord.id },
			include: { hearings: true, planPauseHistory: true }
		});

		const isSound = formatValue(examinationData?.isSound);

		const workshops = sortByDateColumn(gateway2Data?.workshops ?? [], 'createdDate');
		const hearings = sortByDateColumn(examinationData?.hearings ?? [], 'createdDate');
		const proceedSubmission = gateway3Data?.submissions.find(
			(submission) => submission.decision === GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION
		);

		res.locals.journeyResponse = new JourneyResponse(journeyId, '', {
			...gateway1Data,
			...gateway2Data,
			...gateway3Data,
			...examinationData,
			expectedDate: gateway2Data?.expectedDate,
			actualDate: gateway2Data?.actualDate,
			gateway3ExpectedDate: gateway3Data?.expectedDate,
			gateway3ActualDate: gateway3Data?.actualDate,
			gateway3CompletionDate: proceedSubmission?.completionDate,
			workshops,
			hearings,
			isSound
		});

		if (next) next();
	}
}
