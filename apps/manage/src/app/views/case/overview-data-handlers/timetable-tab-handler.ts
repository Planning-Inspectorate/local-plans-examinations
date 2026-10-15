import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { formatValue } from '../../../util/util.ts';
import { sortGateway2Workshops } from '../../../../util/util.ts';

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
			where: { caseId: caseRecord.id }
		});
		const examinationData = await db.examinationInfo.findUnique({
			where: { caseId: caseRecord.id }
		});

		const isSound = formatValue(examinationData?.isSound);

		const workshops = sortGateway2Workshops(gateway2Data?.workshops ?? []);
		res.locals.journeyResponse = new JourneyResponse(journeyId, '', {
			...gateway1Data,
			...gateway2Data,
			workshops,
			...gateway3Data,
			...examinationData,
			isSound
		});

		if (next) next();
	}
}
