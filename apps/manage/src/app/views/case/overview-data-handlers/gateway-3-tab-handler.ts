import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { addUploadedDocumentDetailsToAnswers } from './overview-page-helper.ts';
import type { ManageService } from '#service';
import { getParam } from '../controller.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import { sortGateway3Submissions } from '#util/util.ts';

export class Gateway3TabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, caseRecord } = context;
		if (
			req.method === 'GET' &&
			String(req.params.question).startsWith(COMMON_CONSTS.GATEWAY_3_DECISION_QUESTION) &&
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
		const submissionData = sortGateway3Submissions(journey3Data.submissions);
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
		await this.addGateway3FrontOfficeDocumentsToAnswers(service, caseRecord.id, journeyResponse, submissionData);
		res.locals.journeyResponse = journeyResponse;
		if (next) next();
	}

	/**
	 * Enrich the journeyResponse with gateway3 documents pulled from the front office
	 * @param service The manage service
	 * @param caseId The unique id of the case
	 * @param journeyResponse The journey response to write the answers to
	 * @param submissionData List of submission data objects from the database for the given case
	 */
	protected async addGateway3FrontOfficeDocumentsToAnswers(
		service: ManageService,
		caseId: string,
		journeyResponse: JourneyResponse,
		submissionData: {
			id: string;
			decision: string | null;
			completionDate: Date | null;
			gateway3InfoId: string | null;
		}[]
	) {
		const gateway3DocumentSetNamePrefixesWithCategories: Record<string, Record<string, string>> = {
			required: {
				'gateway-3-document-exam-website': 'Examination website',
				'gateway-3-document-proposed-plan': 'Proposed local plan intended for submission for examination',
				'gateway-3-document-map-of-proposed-plan': 'Map of proposed local plan policies',
				'gateway-3-document-statement-of-compliance': 'Statement of Compliance',
				'gateway-3-document-statement-of-soundness': 'Statement of Soundness',
				'gateway-3-document-summary-of-engagement':
					'Summary of consultation and engagement activities undertaken in preparing the proposed local plan',
				'gateway-3-document-summary-of-scoping-consultation': 'Summary of scoping consultation',
				'gateway-3-document-summary-of-consultation-and-evidence':
					'Summary of consultation on proposed local plan content and evidence',
				'gateway-3-document-summary-of-consultation': 'Summary of consultation on proposed local plan',
				'gateway-3-document-statement-of-practical-arrangements':
					'Statement setting out practical arrangements demonstrating readiness for examination'
			},
			optional: {
				'gateway-3-document-copies-of-representations': 'Copies of representations',
				'gateway-3-document-supplementary-exams-statement': 'Supplementary plans statement',
				'gateway-3-document-environmental-report': 'Environmental report',
				'gateway-3-document-statement-of-environment-reasons':
					'Statement of reasons for a determination that the proposed local plan is unlikely to have significant environmental effects',
				'gateway-3-document-summary-of-representations':
					'Summary of representations relating to progress towards meeting prescribed requirements and the LPA response',
				'gateway-3-document-summary-of-gw2-remediations':
					'Summary of how Gateway 2 assessor issues have been addressed',
				'gateway-3-document-summary-of-changes':
					'Statement explaining changes since the proposed local plan consultation, reasons for those changes, and any additional consultation',
				'gateway-3-document-other-documents': 'Other documents'
			}
		};
		const gateway3DocumentSetNamePrefixes = {
			...gateway3DocumentSetNamePrefixesWithCategories['required'],
			...gateway3DocumentSetNamePrefixesWithCategories['optional']
		};
		for (let i = 0; i < submissionData.length; i++) {
			const submissionId = i + 1;
			const gateway3DocumentSetNamesForSubmissionId = Object.fromEntries(
				Object.entries(gateway3DocumentSetNamePrefixes).map(([k, v]) => [`${k}-${i + 1}`, v])
			);
			const submissionDocumentSetIds = await DocumentUtil.getDocumentSetIdsByFolderName(
				service,
				Object.keys(gateway3DocumentSetNamesForSubmissionId)
			);
			const submissionDocumentsByCategory = await Promise.all(
				Object.entries(gateway3DocumentSetNamePrefixesWithCategories).map(async ([category, documentSets]) => ({
					category,
					documents: await Promise.all(
						Object.entries(documentSets).map(async ([k, v]) => {
							const documentSetId = submissionDocumentSetIds.get(k);

							const files = documentSetId
								? await DocumentUtil.loadUploadedDocuments(service, caseId, documentSetId)
								: [];

							return {
								title: v,
								files
							};
						})
					)
				}))
			);
			journeyResponse.answers[`gateway3FrontOfficeDocuments-${submissionId}`] = submissionDocumentsByCategory;
		}
	}
}
