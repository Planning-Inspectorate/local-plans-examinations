import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { JourneyDataLoadHandler, type JourneyDataLoadContext } from './journey-data-load-handler.ts';

export class ExaminationDataLoadHandler extends JourneyDataLoadHandler {
	public async handle(context: JourneyDataLoadContext): Promise<void> {
		const { res, next, service, journeyId, caseRecord } = context;
		const { db } = service;

		const journey4Data = await db.examinationInfo.findUnique({ where: { caseId: caseRecord.id } });
		// TODO: proper view-model mapping to answers formats
		// use dynamic-forms constants for BOOLEAN_OPTIONS
		let isSound: string | null = null;
		if (typeof journey4Data?.isSound === 'boolean') {
			isSound = journey4Data?.isSound ? 'yes' : 'no';
		}
		const journeyResponse = new JourneyResponse(journeyId, '', journey4Data);
		journeyResponse.answers.isSound = isSound;
		res.locals.journeyResponse = journeyResponse;
		if (next) next();
	}
}
