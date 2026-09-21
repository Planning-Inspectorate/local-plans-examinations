import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { addUploadedDocumentDetailsToAnswers } from './overview-page-helper.ts';
import { fileUploaderCaseSessionKeyForField } from '../controller.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';

export class Gateway2TabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, caseRecord } = context;
		const { db } = service;

		const gateway2DocumentSets = {
			procedural: [
				{ folderName: 'covering-letter', title: 'Gateway 2 covering letter' },
				{ folderName: 'local-plan-timetable', title: 'Local plan timetable' },
				{ folderName: 'project-initiation-document', title: 'Project initiation document' },
				{ folderName: 'draft-stat-compliance', title: 'Draft statement of compliance' },
				{ folderName: 'draft-stat-soundness', title: 'Draft statement of soundness' }
			],
			consultation: [
				{ folderName: 'notice-of-intent', title: 'Notice of intention to commence local plan preparation' },
				{ folderName: 'scoping-cons', title: 'Scoping consultation documents' },
				{ folderName: 'cons-summ', title: 'Consultation summary of feedback to scoping consultation' },
				{ folderName: 'g1-self-assess', title: 'Gateway 1 - Self assessment of readiness' },
				{ folderName: 'cons-of-proposed', title: 'Consultation on proposed local plan content and evidence documents' },
				{
					folderName: 'summary-of-consultation',
					title: 'Summary of consultation on proposed local plan content and evidence documents'
				}
			],
			additional: [
				{
					folderName: 'subsequent-work-towards-a-draft-plan',
					title: 'Subsequent work towards a draft plan'
				}
			]
		};

		const allDocumentSets = Object.values(gateway2DocumentSets).flat();

		const documentSetIds = await DocumentUtil.getDocumentSetIdsByFolderName(
			service,
			allDocumentSets.map(({ folderName }) => folderName)
		);

		const documentsByCategory = await Promise.all(
			Object.entries(gateway2DocumentSets).map(async ([category, documentSets]) => ({
				category,
				documents: await Promise.all(
					documentSets.map(async ({ folderName, title }) => {
						const documentSetId = documentSetIds.get(folderName);

						const files = documentSetId
							? await DocumentUtil.loadUploadedDocuments(service, caseRecord.id, documentSetId)
							: [];

						return {
							title,
							files
						};
					})
				)
			}))
		);

		const journey2Data = await db.gateway2Info.findUnique({ where: { caseId: caseRecord.id } });
		await addUploadedDocumentDetailsToAnswers(service, caseRecord, req, journey2Data);
		res.locals.journeyResponse = new JourneyResponse(journeyId, '', journey2Data);
		const journeyResponse = res.locals.journeyResponse as JourneyResponse;
		journeyResponse.answers.gateway2Documents = documentsByCategory;
		res.locals.journeyResponse = journeyResponse;
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
