import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { addUploadedDocumentDetailsToAnswers } from './overview-page-helper.ts';

export class Gateway1TabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, caseRecord } = context;
		const { db } = service;

		const journey1Data = await db.gateway1Info.findUnique({ where: { caseId: caseRecord.id } });
		await addUploadedDocumentDetailsToAnswers(
			service,
			caseRecord,
			req,
			journey1Data,
			COMMON_CONSTS.GATEWAY_1_JOURNEY_ID
		);
		res.locals.journeyResponse = new JourneyResponse(journeyId, '', journey1Data);
		if (
			req.method === 'POST' &&
			req.params.question === COMMON_CONSTS.SIGNED_SLA_QUESTION &&
			req.originalUrl.endsWith(req.params.question)
		) {
			// TODO need to check if there are documents - only redirect if there are documents
			res.redirect(303, `${COMMON_CONSTS.SIGNED_SLA_QUESTION}/check`);
			return;
		}
		if (next) next();
	}
}
