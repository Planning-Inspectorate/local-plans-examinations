import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { ManageService } from '#service';
import type { Request } from 'express';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import {
	journeyFileUploadQuestionConfigs,
	fileUploaderCaseSessionKeyForField,
	type UploadDocumentRequest
} from '../controller.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { fileUploadQuestionProperties } from '../questions.ts';
import { sortGateway3Submissions } from '#util/util.ts';
import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

export async function getOverviewData(db: PrismaClient, reference: string) {
	return db.case.findUnique({
		where: { reference },
		include: {
			lpas: true,
			contacts: true,
			gateway2Info: {
				select: {
					assessorName: true
				}
			},
			gateway3Info: {
				select: {
					programmeOfficerFirstName: true,
					programmeOfficerLastName: true,
					programmeOfficerEmail: true,
					assessorName: true
				}
			},
			caseHistories: {
				orderBy: { date: 'desc' }
			},
			examinationInfo: {
				select: {
					examiningInspector1: true,
					examiningInspector2: true,
					examiningInspector3: true,
					examinationWebsite: true,
					qaInspector1: true,
					qaInspector2: true,
					qaInspector3: true
				}
			},
			notes: true
		}
	});
}

export /**
 * Load the documents for the given case and prepopulate the answer fields with their names
 * @param service The manage service
 * @param currentCase The case from the database
 * @param req The request object
 * @param answers The answers that the details should be added to
 */
async function addUploadedDocumentDetailsToAnswers(
	service: ManageService,
	currentCase: any,
	req: Request,
	answers: any,
	journeyId: string
) {
	const request = req as UploadDocumentRequest;
	request.currentCase = currentCase;
	let overrideJourneyId = journeyId;
	if (journeyId == COMMON_CONSTS.GATEWAY_3_REPORT_JOURNEY_ID) {
		overrideJourneyId = COMMON_CONSTS.GATEWAY_3_JOURNEY_ID;
	}
	let relevantFileUploadQuestionConfigs = journeyFileUploadQuestionConfigs[overrideJourneyId];
	if (overrideJourneyId == 'gateway-3') {
		// Filter down the available file upload questions for gateway 3 to only include "active" submissions, since there are many "hidden" questions to allow multiple gw3 submissions
		const lastSubmissionId = answers.submissions.length;
		relevantFileUploadQuestionConfigs = relevantFileUploadQuestionConfigs.filter((elem: any) =>
			Number(elem.fieldName.replace('gateway3Documents-', ''))
				? Number(elem.fieldName.replace('gateway3Documents-', '')) <= lastSubmissionId
				: true
		);
	}
	if (!relevantFileUploadQuestionConfigs) {
		return;
	}

	const documentSetIdsByFolderName = await DocumentUtil.getDocumentSetIdsByFolderName(
		service,
		relevantFileUploadQuestionConfigs.map((questionConfig: any) => questionConfig.url)
	);

	const uploadPageUrls = new Set(
		Object.values(fileUploadQuestionProperties)
			.map((question) => question.url)
			.filter((url): url is string => Boolean(url))
	);

	const gateway3SubmissionNumber = String(req.params.question).match(/^gateway-3-document-(\d+)$/)?.[1];
	const isIssuedGateway3Document =
		gateway3SubmissionNumber &&
		sortGateway3Submissions(answers.submissions ?? [])[Number(gateway3SubmissionNumber) - 1]?.completionDate;
	const isManageDocumentRemoval =
		req.params.question === COMMON_CONSTS.EXAMINATION_REPORT_QUESTION &&
		(req.url.includes('/remove/') || req.body?.returnToManage === 'true');
	const isUploadPages =
		!!req.params.question &&
		uploadPageUrls.has(req.params.question as string) &&
		!req.url.includes('/check') &&
		!isIssuedGateway3Document &&
		!isManageDocumentRemoval;

	for (const questionConfig of relevantFileUploadQuestionConfigs) {
		const documentSetId = documentSetIdsByFolderName.get(questionConfig.url);
		if (!documentSetId) {
			throw new Error(`Missing document set reference data for "${questionConfig.url}". Run the database static seed.`);
		}

		const uploadedFiles = isUploadPages
			? await DocumentUtil.loadTempUploadedDocuments(service, currentCase.id, documentSetId)
			: await DocumentUtil.loadUploadedDocuments(service, currentCase.id, documentSetId);
		if (isUploadPages && questionConfig.url === COMMON_CONSTS.EXAMINATION_REPORT_QUESTION) {
			uploadedFiles.unshift(...(await DocumentUtil.loadUploadedDocuments(service, currentCase.id, documentSetId)));
		}

		req.session.fileUploader = {
			...request.session.fileUploader,
			[fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName)]: {
				uploadedFiles
			}
		};
		if (uploadedFiles.length > 0) {
			answers[questionConfig.fieldName] = uploadedFiles;
		} else {
			delete answers[questionConfig.fieldName];
		}
	}
}

type Gateway3Answers = {
	id: string;
	caseId: string;
	expectedSubmissionForExaminationDate?: Date | null;
	submissionForExaminationDate?: Date | null;
	examiningInspector1?: string | null;
	examiningInspector2?: string | null;
	examiningInspector3?: string | null;
	examiningInspectorAppointmentDate?: Date | null;
	examinationWebsite?: string | null;
};
type CompiledGateway3Answers = Gateway3Answers & {
	optionalData: {
		[k: string]: string;
	};
};

export const compileGateway3Data = async (
	db: PrismaClient,
	currentData: Gateway3Answers
): Promise<CompiledGateway3Answers> => {
	const REQUIRED_DOCUMENT_SETS = {
		proposedLocalPlan: DOCUMENT_SET_ID.G3_PROPOSED_LOCAL_PLAN,
		mapOfPolicies: DOCUMENT_SET_ID.G3_MAP_OF_POLICIES,
		statementOfCompliance: DOCUMENT_SET_ID.G3_STATEMENT_OF_COMPLIANCE,
		statementOfSoundness: DOCUMENT_SET_ID.G3_STATEMENT_OF_SOUNDNESS,
		consultationEngagementSummary: DOCUMENT_SET_ID.G3_CONSULTATION_ENGAGEMENT_SUMMARY,
		scopingConsultationSummary: DOCUMENT_SET_ID.G3_SCOPING_CONSULTATION_SUMMARY,
		consultationContentEvidenceSummary: DOCUMENT_SET_ID.G3_CONSULTATION_CONTENT_EVIDENCE_SUMMARY,
		consultationProposedPlanSummary: DOCUMENT_SET_ID.G3_CONSULTATION_PROPOSED_PLAN_SUMMARY,
		practicalArrangementsStatement: DOCUMENT_SET_ID.G3_PRACTICAL_ARRANGEMENTS_STATEMENT
	};

	const OPTIONAL_DOCUMENT_SETS = {
		copiesOfRepresentations: DOCUMENT_SET_ID.G3_COPIES_OF_REPRESENTATIONS,
		supplementaryPlansStatement: DOCUMENT_SET_ID.G3_SUPPLEMENTARY_PLANS_STATEMENT,
		environmentalReport: DOCUMENT_SET_ID.G3_ENVIRONMENTAL_REPORT,
		statementOfReasonsDetermination: DOCUMENT_SET_ID.G3_STATEMENT_OF_REASONS_DETERMINATION,
		representationsProgressSummary: DOCUMENT_SET_ID.G3_REPRESENTATIONS_PROGRESS_SUMMARY,
		gateway2IssuesSummary: DOCUMENT_SET_ID.G3_GATEWAY_2_ISSUES_SUMMARY,
		changesSinceConsultationStatement: DOCUMENT_SET_ID.G3_CHANGES_SINCE_CONSULTATION_STATEMENT,
		otherDocuments: DOCUMENT_SET_ID.G3_OTHER_DOCUMENTS
	};

	const documents = await db.document.findMany({
		where: {
			caseId: currentData.caseId,
			isDeleted: false,
			documentSetId: {
				in: [...Object.values(REQUIRED_DOCUMENT_SETS), ...Object.values(OPTIONAL_DOCUMENT_SETS)]
			}
		},
		include: { latestDocumentVersion: true }
	});

	const documentsBySetId = new Map<string, typeof documents>();
	for (const document of documents) {
		const group = documentsBySetId.get(document.documentSetId) ?? [];
		group.push(document);
		documentsBySetId.set(document.documentSetId, group);
	}

	const documentsForFields = (sets: Record<string, string>) =>
		Object.fromEntries(
			Object.entries(sets).map(([field, setId]) => [
				field,
				(documentsBySetId.get(setId) ?? [])
					.map((document) => document.latestDocumentVersion?.originalFilename ?? document.name)
					.join(', ')
			])
		);

	const data = {
		...documentsForFields(REQUIRED_DOCUMENT_SETS),
		optionalData: documentsForFields(OPTIONAL_DOCUMENT_SETS)
	};

	return { ...data, ...currentData };
};
