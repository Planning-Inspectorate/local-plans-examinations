import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { formatValue } from '../../../util/util.ts';
import { sortByCreatedDate } from '#util/util.ts';

export class ExaminationTabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { res, next, service, journeyId, caseRecord } = context;
		const { db } = service;

		const journey4Data = await db.examinationInfo.findUnique({
			where: { caseId: caseRecord.id },
			include: { pauses: true }
		});
		const isSound = formatValue(journey4Data?.isSound);

		const journeyResponse = new JourneyResponse(journeyId, '', journey4Data);
		journeyResponse.answers.isSound = isSound;
		const pauseData = sortByCreatedDate(journey4Data?.pauses ? journey4Data?.pauses : []);
		for (let i = 0; i < pauseData.length; i++) {
			journeyResponse.answers[`startDate-${i + 1}`] = pauseData[i].startDate;
			journeyResponse.answers[`details-${i + 1}`] = pauseData[i].details;
			journeyResponse.answers[`endDate-${i + 1}`] = pauseData[i].endDate;
		}
		res.locals.journeyResponse = journeyResponse;
		if (next) next();
	}
}
