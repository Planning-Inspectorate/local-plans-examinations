import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { addUploadedDocumentDetailsToAnswers, compileGateway3Data } from './overview-page-helper.ts';
import { getParam } from '../controller.ts';

export class Gateway3TabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, caseRecord } = context;
		if (
			req.method === 'GET' &&
			String(req.params.question).startsWith('gateway-3-decision') &&
			req.originalUrl.endsWith(String(req.params.question))
		) {
			const submissionId = Number(String(req.params.question).split('-').at(-1));
			const caseReference = getParam(req.params.reference);
			// Navigate to gw3 report subjourney
			res.redirect(
				`/case/${encodeURIComponent(caseReference)}/${encodeURIComponent(COMMON_CONSTS.GATEWAY_3_REPORT_JOURNEY_ID)}/gateway-3-submission-${submissionId}/gateway-3-decision-${submissionId}`
			);
			return;
		}
		const { db } = service;

		const journey3Data = await db.gateway3Info.findUnique({
			include: {
				submissions: true
			},
			where: { caseId: caseRecord.id }
		});
		if (!journey3Data) {
			throw Error('No gateway3info data found');
		}
		await addUploadedDocumentDetailsToAnswers(
			service,
			caseRecord,
			req,
			journey3Data,
			COMMON_CONSTS.GATEWAY_3_JOURNEY_ID
		);

		const journey4Data = await db.examinationInfo.findUnique({ where: { caseId: caseRecord.id } });
		const journeyResponse = new JourneyResponse(journeyId, '', journey3Data);
		journeyResponse.answers.examinationWebsite = journey4Data?.examinationWebsite;

		journeyResponse.answers = await compileGateway3Data(db, {
			...journey3Data,
			examinationWebsite: journey4Data?.examinationWebsite
		});
		res.locals.journeyResponse = journeyResponse;

		if (next) next();
	}
}
