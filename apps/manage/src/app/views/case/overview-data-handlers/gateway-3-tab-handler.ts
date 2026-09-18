import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { addUploadedDocumentDetailsToAnswers } from './overview-page-helper.ts';
import {
	fileUploadQuestionConfigs,
	fileUploaderCaseSessionKeyForField,
	getParam,
	updateGateway3
} from '../controller.ts';

export class Gateway3TabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, caseRecord } = context;
		const { db } = service;

		const journey3Data = await db.gateway3Info.findUnique({ where: { caseId: caseRecord.id } });
		await addUploadedDocumentDetailsToAnswers(service, caseRecord, req, journey3Data);
		const journey4Data = await db.examinationInfo.findUnique({ where: { caseId: caseRecord.id } });
		const journeyResponse = new JourneyResponse(journeyId, '', journey3Data);
		journeyResponse.answers.examinationWebsite = journey4Data?.examinationWebsite;
		res.locals.journeyResponse = journeyResponse;
		const body = req.body as { decision?: string };
		// Flow for uploading a gateway 3 document
		if (
			req.method === 'POST' &&
			req.params.question === COMMON_CONSTS.GATEWAY_3_DECISION_QUESTION &&
			req.originalUrl.endsWith(req.params.question)
		) {
			const caseReference = getParam(req.params.reference);
			await updateGateway3(
				db,
				{
					decision: body.decision
				},
				caseReference,
				COMMON_CONSTS.GATEWAY_3_DECISION_QUESTION
			);
			res.redirect(303, COMMON_CONSTS.GATEWAY_3_DOCUMENT_QUESTION);
			return;
		}
		if (
			req.method === 'POST' &&
			req.params.question === COMMON_CONSTS.GATEWAY_3_DOCUMENT_QUESTION &&
			req.originalUrl.endsWith(req.params.question)
		) {
			const questionConfig = fileUploadQuestionConfigs.find(
				(question) => question.url === COMMON_CONSTS.GATEWAY_3_DOCUMENT_QUESTION
			);
			if (!questionConfig) {
				throw new Error(
					`Could not find question config for question url '${COMMON_CONSTS.GATEWAY_3_DOCUMENT_QUESTION}'`
				);
			}
			const uploadedFiles =
				req.session.fileUploader?.[fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName)]?.uploadedFiles ??
				[];
			if (uploadedFiles.length > 0) {
				res.redirect(303, `${COMMON_CONSTS.GATEWAY_3_DOCUMENT_QUESTION}/check`);
				return;
			}
		}
		if (next) next();
	}
}
