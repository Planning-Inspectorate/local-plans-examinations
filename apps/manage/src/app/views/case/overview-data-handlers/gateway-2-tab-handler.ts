import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { addUploadedDocumentDetailsToAnswers } from './overview-page-helper.ts';
import { fileUploaderCaseSessionKeyForField } from '../controller.ts';

export class Gateway2TabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, caseRecord } = context;
		const { db } = service;

		const journey2Data = await db.gateway2Info.findUnique({ where: { caseId: caseRecord.id } });
		await addUploadedDocumentDetailsToAnswers(service, caseRecord, req, journey2Data);
		res.locals.journeyResponse = new JourneyResponse(journeyId, '', journey2Data);
		if (
			req.method === 'POST' &&
			req.params.question === COMMON_CONSTS.GATEWAY_2_REPORT_QUESTION &&
			req.originalUrl.endsWith(req.params.question)
		) {
			const uploadedGateway2Reports =
				req.session.fileUploader?.[fileUploaderCaseSessionKeyForField(req, 'gateway2Report')]?.uploadedFiles ?? [];
			if (uploadedGateway2Reports.length > 0) {
				res.redirect(303, `${COMMON_CONSTS.GATEWAY_2_REPORT_QUESTION}/check`);
				return;
			}
		}

		if (next) next();
	}
}
