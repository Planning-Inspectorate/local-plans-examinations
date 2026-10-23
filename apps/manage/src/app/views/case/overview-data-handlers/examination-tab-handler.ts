import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { addUploadedDocumentDetailsToAnswers } from './overview-page-helper.ts';
import { formatValue } from '../../../util/util.ts';
import { sortByDateColumn } from '#util/util.ts';
import { consumeAlertsFromSession } from '../../../util/alert.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { fileUploaderCaseSessionKeyForField } from '../controller.ts';

export class ExaminationTabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, caseRecord } = context;
		const { db } = service;

		const journey4Data = await db.examinationInfo.findUnique({
			where: { caseId: caseRecord.id },
			include: { planPauseHistory: true, hearings: true }
		});
		if (!journey4Data) {
			throw Error(`Could not fetch exam data for case '${caseRecord.id}'`);
		}
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
		const sortedPauseData = sortByDateColumn(
			journey4Data?.planPauseHistory ? journey4Data?.planPauseHistory : [],
			'createdAt'
		);
		for (let i = 0; i < sortedPauseData.length; i++) {
			journeyResponse.answers[`planPauseDate-${i + 1}`] = sortedPauseData[i].planPauseDate;
			journeyResponse.answers[`planPauseStartDetails-${i + 1}`] = sortedPauseData[i].planPauseStartDetails;
			journeyResponse.answers[`planPauseEndDate-${i + 1}`] = sortedPauseData[i].planPauseEndDate;
			journeyResponse.answers[`planPauseEndDetails-${i + 1}`] = sortedPauseData[i].planPauseEndDetails;
		}
		if ((!req.params.question || String(req.params.question) == 'examination-report-manage') && req.method === 'GET') {
			await this.tryAddPauseStatusBanner(context, journey4Data);
			consumeAlertsFromSession(req, res);
		}
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
		this.addVirusScanStatusToLocals(req, res, journeyId);

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
