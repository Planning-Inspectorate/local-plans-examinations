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

		if (journey4Data) {
			await addUploadedDocumentDetailsToAnswers(service, caseRecord, req, journey4Data, journeyId);
		}
		const journeyResponse = new JourneyResponse(journeyId, '', journey4Data);
		journeyResponse.answers.isSound = isSound;
		res.locals.journeyResponse = journeyResponse;

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
