import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { formatValue } from '../../../util/util.ts';
import { sortByCreatedDate } from '#util/util.ts';

type PauseData = {
	createdDate: Date;
	startDate: Date;
	details: string | null;
	endDate: Date | null;
	examinationInfoId: string;
};

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
		const sortedPauseData = sortByCreatedDate(journey4Data?.pauses ? journey4Data?.pauses : []);
		for (let i = 0; i < sortedPauseData.length; i++) {
			journeyResponse.answers[`startDate-${i + 1}`] = sortedPauseData[i].startDate;
			journeyResponse.answers[`details-${i + 1}`] = sortedPauseData[i].details;
			journeyResponse.answers[`endDate-${i + 1}`] = sortedPauseData[i].endDate;
		}
		if (ExaminationTabHandler.isCurrentlyPaused(sortedPauseData as PauseData[])) {
			res.locals.alertMessage = 'This examination is paused';
			res.locals.alertMessageStatus = 'important';
		}
		res.locals.journeyResponse = journeyResponse;
		if (next) next();
	}
	/**
	 * Return true if there are any pauses that overlap with the current datetime
	 * @param pauses The list of pauses from the database
	 * @returns True if there is an overlap, false otherwise
	 */
	public static isCurrentlyPaused(pauses: PauseData[]) {
		const currentTime = new Date();
		for (const pause of pauses) {
			const indefinitelyPaused = !pause.endDate;
			if (currentTime >= pause.startDate && (indefinitelyPaused || (pause.endDate && currentTime <= pause.endDate))) {
				return true;
			}
		}
		return false;
	}
}
