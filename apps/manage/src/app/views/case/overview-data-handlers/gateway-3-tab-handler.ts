import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { addUploadedDocumentDetailsToAnswers } from './overview-page-helper.ts';
import {
	fileUploadQuestionConfigs,
	fileUploaderCaseSessionKeyForField,
	getParam,
	updateGateway3
} from '../controller.ts';
import { sortGateway3Submissions } from '#util/util.ts';

export class Gateway3TabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, caseRecord } = context;
		const { db } = service;

		const journey3Data = await db.gateway3Info.findUnique({
			include: {
				submissions: true
			},
			where: { caseId: caseRecord.id }
		});
		if (!journey3Data) {
			throw Error('No gatewa3info data found');
		}
		const submissionData = sortGateway3Submissions(journey3Data.submissions);
		await addUploadedDocumentDetailsToAnswers(service, caseRecord, req, journey3Data);
		const journey4Data = await db.examinationInfo.findUnique({ where: { caseId: caseRecord.id } });
		const journeyResponse = new JourneyResponse(journeyId, '', journey3Data);
		journeyResponse.answers.examinationWebsite = journey4Data?.examinationWebsite;
		for (let i = 0; i < submissionData.length; i++) {
			journeyResponse.answers[`decision-${i + 1}`] = submissionData[i].decision;
			journeyResponse.answers[`completionDate-${i + 1}`] = submissionData[i].completionDate;
		}
		res.locals.journeyResponse = journeyResponse;
		const body = req.body as { decision?: string };
		// Flow for uploading a gateway 3 document
		if (
			req.method === 'POST' &&
			String(req.params.question).startsWith('gateway-3-decision') &&
			req.originalUrl.endsWith(String(req.params.question))
		) {
			const submissionNumber = String(req.params.question).replace('gateway-3-decision-', '');
			if (!/^\d+$/.test(submissionNumber)) {
				throw new Error('Invalid submission number');
			}
			const caseReference = getParam(req.params.reference);
			const updatedSubmissions = sortGateway3Submissions(journey3Data?.submissions);
			if (!updatedSubmissions) {
				throw Error('No submission found');
			}
			const currentSubmission = updatedSubmissions.at(-1);
			if (!currentSubmission) {
				throw Error('Last submission was undefined');
			}
			currentSubmission.decision = body[`decision-${submissionNumber}` as keyof typeof body] ?? null;
			await updateGateway3(
				db,
				{
					submissions: updatedSubmissions
				},
				caseReference,
				String(req.params.question)
			);
			res.redirect(303, `gateway-3-document-${submissionNumber}`);
			return;
		}
		if (
			req.method === 'POST' &&
			String(req.params.question).startsWith('gateway-3-document') &&
			req.originalUrl.endsWith(String(req.params.question))
		) {
			const submissionNumber = String(req.params.question).replace('gateway-3-document-', '');
			if (!/^\d+$/.test(submissionNumber)) {
				throw new Error('Invalid submission number');
			}
			const questionConfig = fileUploadQuestionConfigs.find((question) => question.url == req.params.question);
			if (!questionConfig) {
				throw new Error(`Could not find question config for question url 'gateway-3-document'`);
			}
			const uploadedFiles =
				req.session.fileUploader?.[fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName)]?.uploadedFiles ??
				[];
			if (uploadedFiles.length > 0) {
				res.redirect(303, `gateway-3-document-${submissionNumber}/check`);
				return;
			}
		}
		if (next) next();
	}
}
