import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import {
	addUploadedDocumentDetailsToAnswers,
	type CompiledGateway3Answers,
	compileGateway3Data
} from './overview-page-helper.ts';
import { getParam } from '../controller.ts';
import { consumeAlertsFromSession } from '../../../util/alert.ts';
import { DOCUMENT_LABELS, REQUIRED_DOCUMENT_SETS } from '../../layouts/custom-documents-viewer/question.ts';


export const getMissingRequiredDocuments = (answers: CompiledGateway3Answers) =>
	(Object.keys(REQUIRED_DOCUMENT_SETS) as Array<keyof typeof REQUIRED_DOCUMENT_SETS>).filter(
		(field) => !answers[field as keyof CompiledGateway3Answers]
	);

const toDocumentId = (field: string) =>
	`document-${(DOCUMENT_LABELS[field] ?? field)
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')}`;

const toErrorText = (field: string) => {
	const label = DOCUMENT_LABELS[field] ?? field;
	return `${label.charAt(0).toLocaleUpperCase()}${label.slice(1)} document is required.`;
};

export class Gateway3TabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, caseRecord } = context;
		if (!req.params.question && req.method == 'GET') {
			await this.tryAddPauseStatusBanner(context);
			consumeAlertsFromSession(req, res);
		}
		if (
			req.method === 'GET' &&
			String(req.params.question).startsWith('gateway-3-decision') &&
			req.originalUrl.endsWith(String(req.params.question))
		) {
			const submissionId = Number(String(req.params.question).split('-').at(-1));
			const caseReference = getParam(req.params.reference);

			const gateway3Info = await service.db.gateway3Info.findUnique({ where: { caseId: caseRecord.id } });
			if (!gateway3Info) {
				throw Error('No gateway3info data found');
			}
			const compiled = await compileGateway3Data(service.db, gateway3Info);
			const missing = getMissingRequiredDocuments(compiled);

			if (missing.length > 0) {
				req.session.gateway3DocumentErrors = missing.map((field) => ({
					text: toErrorText(field),
					href: `#${toDocumentId(field)}`
				}));
				res.redirect(
					`/case/${encodeURIComponent(caseReference)}/${COMMON_CONSTS.GATEWAY_3_JOURNEY_ID}/${encodeURIComponent(String(req.params.section))}/gateway-3-review-documents-${submissionId}`
				);
				return;
			}

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

		if (
			req.method === 'GET' &&
			String(req.params.question).startsWith('gateway-3-review-documents') &&
			req.session.gateway3DocumentErrors
		) {
			res.locals.errorSummary = req.session.gateway3DocumentErrors;
			delete req.session.gateway3DocumentErrors;
		}

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
