import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { addUploadedDocumentDetailsToAnswers } from './overview-page-helper.ts';
import { fileUploaderCaseSessionKeyForField, fileUploadQuestionConfigs } from '../controller.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import { consumeAlertsFromSession } from '../../../util/alert.ts';
import { buildAssessorTabLocals } from '../assessor-helper.ts';

export class Gateway2TabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, caseRecord } = context;
		const { db } = service;
		if (!req.params.question && req.method == 'GET') {
			await this.tryAddPauseStatusBanner(context);
			consumeAlertsFromSession(req, res);
		}

		const gateway2DocumentSets = {
			procedural: [
				{ folderName: 'covering-letter', title: 'Gateway 2 cover letter' },
				{ folderName: 'local-plan-timetable', title: 'Local plan timetable' },
				{ folderName: 'project-initiation-document', title: 'Project initiation document' },
				{ folderName: 'draft-stat-compliance', title: 'Draft statement of compliance' },
				{ folderName: 'draft-stat-soundness', title: 'Draft statement of soundness' },
				{ folderName: 'gateway-2-workshop-documents', title: 'Workshop document' }
			],
			consultation: [
				{
					folderName: 'notice-of-intent',
					title: 'Notice of intention to commence local plan preparation'
				},
				{ folderName: 'scoping-cons', title: 'Scoping consultation documents' },
				{ folderName: 'cons-summ', title: 'Summary of scoping consultation feedback' },
				{
					folderName: 'summary-of-consultation',
					title: 'Summary of consultation on proposed local plan content and evidence'
				},
				{ folderName: 'g1-self-assess', title: 'Gateway 1 self-assessment' },
				{ folderName: 'cons-of-proposed', title: 'Consultation on proposed local plan content and evidence' },
				{
					folderName: 'evidence-on-engagement',
					title: 'Evidence on engagement between plan making authorities and relevant bodies'
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

		if (req.method === 'GET' && journeyId === COMMON_CONSTS.GATEWAY_2_JOURNEY_ID) {
			req.session.fileUploader = initaliseFileInSession(req, documentsByCategory);
		}

		const journey2Data = await db.gateway2Info.findUnique({
			where: {
				caseId: caseRecord.id
			},
			include: {
				workshops: true
			}
		});

		await addUploadedDocumentDetailsToAnswers(
			service,
			caseRecord,
			req,
			journey2Data,
			COMMON_CONSTS.GATEWAY_2_JOURNEY_ID
		);

		res.locals.journeyResponse = new JourneyResponse(journeyId, '', journey2Data);

		const journeyResponse = res.locals.journeyResponse as JourneyResponse;
		journeyResponse.answers.gateway2Documents = documentsByCategory;

		if (journeyId === COMMON_CONSTS.GATEWAY_2_JOURNEY_ID) {
			Object.assign(
				res.locals,
				await buildAssessorTabLocals(service, req, String(req.params.reference), 'gateway-2', journey2Data)
			);
		}

		res.locals.journeyResponse = journeyResponse;
		const question = String(req.params.question ?? '');
		this.addVirusScanStatusToLocals(req, res, journeyId);
		if (
			req.method === 'POST' &&
			(req.params.question === COMMON_CONSTS.GATEWAY_2_REPORT_QUESTION ||
				req.params.question == COMMON_CONSTS.GATEWAY_2_WORKSHOP_DOCUMENTS_QUESTION) &&
			req.originalUrl.endsWith(req.params.question)
		) {
			let uploadedGateway2Reports;
			if (req.params.question == 'gateway-2-report') {
				uploadedGateway2Reports =
					req.session.fileUploader?.[fileUploaderCaseSessionKeyForField(req, 'gateway2Report')]?.uploadedFiles ?? [];

				if (uploadedGateway2Reports.length > 0) {
					res.redirect(303, `${COMMON_CONSTS.GATEWAY_2_REPORT_QUESTION}/check`);
					return;
				}
			}

			// Preserve the existing Gateway 2 workshop documents check-page redirect.
			if (question === COMMON_CONSTS.GATEWAY_2_WORKSHOP_DOCUMENTS_QUESTION) {
				const uploadedFiles =
					req.session.fileUploader?.[fileUploaderCaseSessionKeyForField(req, 'gateway2WorkshopDocuments')]
						?.uploadedFiles ?? [];

				if (uploadedFiles.length > 0) {
					res.redirect(303, `${COMMON_CONSTS.GATEWAY_2_WORKSHOP_DOCUMENTS_QUESTION}/check`);
					return;
				}
			}

			// Send ordinary Gateway 2 document uploads to their check page.
			if (COMMON_CONSTS.GATEWAY_2_DOCUMENT_QUESTIONS.includes(question)) {
				const questionConfig = fileUploadQuestionConfigs.find((config) => config.url === question);

				if (questionConfig) {
					const uploadedFiles =
						req.session.fileUploader?.[fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName)]
							?.uploadedFiles ?? [];

					if (uploadedFiles.length > 0) {
						res.redirect(303, `${questionConfig.url}/check`);
						return;
					}
				}
			}
		}

		if (next) next();
	}
}

type DocumentsByCategory = {
	category: string;
	documents: {
		title: string;
		files: Awaited<ReturnType<typeof DocumentUtil.loadUploadedDocuments>>;
	}[];
}[];

function initaliseFileInSession(req: any, documentsByCategory: DocumentsByCategory) {
	const caseRef = req.params.reference;

	const fileUploader: Record<string, { uploadedFiles: any[] }> = req.session.fileUploader ?? {
		[`${caseRef}:gateway2Report`]: { uploadedFiles: [] },
		[`${caseRef}:gateway2WorkshopDocuments`]: { uploadedFiles: [] },
		[`${caseRef}:gateway2CoverLetter`]: { uploadedFiles: [] },
		[`${caseRef}:localPlanTimetable`]: { uploadedFiles: [] },
		[`${caseRef}:projectInitiationDocument`]: { uploadedFiles: [] },
		[`${caseRef}:draftStatementOfCompliance`]: { uploadedFiles: [] },
		[`${caseRef}:noticeOfIntention`]: { uploadedFiles: [] },
		[`${caseRef}:gateway1SelfAssessment`]: { uploadedFiles: [] },
		[`${caseRef}:consultationOnProposedContent`]: { uploadedFiles: [] },
		[`${caseRef}:draftStatementOfSoundness`]: { uploadedFiles: [] },
		[`${caseRef}:scopingConsultationDocuments`]: { uploadedFiles: [] },
		[`${caseRef}:consultationSummaryFeedbackScoping`]: { uploadedFiles: [] },
		[`${caseRef}:consultationSummaryProposedContent`]: { uploadedFiles: [] },
		[`${caseRef}:evidenceOnEngagement`]: { uploadedFiles: [] }
	};

	const documentKeyMapping: Record<string, string> = {
		'Gateway 2 cover letter': 'gateway2CoverLetter',
		'Local plan timetable': 'localPlanTimetable',
		'Project initiation document': 'projectInitiationDocument',
		'Draft statement of compliance': 'draftStatementOfCompliance',
		'Draft statement of soundness': 'draftStatementOfSoundness',
		'Workshop document': 'gateway2WorkshopDocuments',
		'Notice of intention to commence local plan preparation': 'noticeOfIntention',
		'Scoping consultation documents': 'scopingConsultationDocuments',
		'Summary of scoping consultation feedback': 'consultationSummaryFeedbackScoping',
		'Summary of consultation on proposed local plan content and evidence': 'consultationSummaryProposedContent',
		'Gateway 1 self-assessment': 'gateway1SelfAssessment',
		'Consultation on proposed local plan content and evidence': 'consultationOnProposedContent',
		'Evidence on engagement between plan making authorities and relevant bodies': 'evidenceOnEngagement'
	};

	const allDocsFlat = documentsByCategory.flatMap((category) => category.documents);

	allDocsFlat.forEach((document) => {
		const sessionKey = documentKeyMapping[document.title];

		if (sessionKey && document.files?.length > 0) {
			const key = `${caseRef}:${sessionKey}`;

			fileUploader[key] ??= { uploadedFiles: [] };
			fileUploader[key].uploadedFiles.push(...document.files);
		}
	});

	return fileUploader;
}
