import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { addUploadedDocumentDetailsToAnswers } from './overview-page-helper.ts';
import { formatValue } from '../../../util/util.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { fileUploaderCaseSessionKeyForField } from '../controller.ts';

export class ExaminationTabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, caseRecord } = context;
		const { db } = service;

		const journey4Data = await db.examinationInfo.findUnique({
			where: {
				caseId: caseRecord.id
			},
			include: {
				hearings: true
			}
		});
		const isSound = formatValue(journey4Data?.isSound);

		await addUploadedDocumentDetailsToAnswers(
			service,
			caseRecord,
			req,
			journey4Data,
			COMMON_CONSTS.EXAMINATION_JOURNEY_ID
		);
		const journeyResponse = new JourneyResponse(journeyId, '', journey4Data);
		journeyResponse.answers.isSound = isSound;
		res.locals.journeyResponse = journeyResponse;
		if (req.method === 'GET' && req.params.question === COMMON_CONSTS.EXAMINATION_REPORT_MANAGE_QUESTION) {
			const uploadedReports =
				req.session.fileUploader?.[fileUploaderCaseSessionKeyForField(req, 'examinationReport')]?.uploadedFiles ?? [];
			if (journey4Data?.soundUnsoundDate && uploadedReports.length > 0) {
				req.session.examinationReportReturnToManage = true;
			} else {
				delete req.session.examinationReportReturnToManage;
			}
		}

		if (
			req.method === 'POST' &&
			req.params.question === COMMON_CONSTS.EXAMINATION_REPORT_QUESTION &&
			req.originalUrl.endsWith(req.params.question)
		) {
			const uploadedFiles =
				req.session.fileUploader?.[fileUploaderCaseSessionKeyForField(req, 'examinationReport')]?.uploadedFiles ?? [];
			if (uploadedFiles.length > 0) {
				res.redirect(303, `${COMMON_CONSTS.EXAMINATION_REPORT_QUESTION}/check`);
				return;
			}
		}

		if (
			req.method === 'POST' &&
			req.params.question === COMMON_CONSTS.MIQS_QUESTION &&
			req.originalUrl.endsWith(req.params.question)
		) {
			const uploadedMiqs =
				req.session.fileUploader?.[fileUploaderCaseSessionKeyForField(req, 'miqs')]?.uploadedFiles ?? [];
			if (uploadedMiqs.length > 0) {
				res.redirect(303, 'miqs/check');
				return;
			}
		}

		if (next) next();
	}
}
