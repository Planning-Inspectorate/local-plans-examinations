import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { ManageService } from '#service';
import type { Request } from 'express';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import {
	journeyFileUploadQuestionConfigs,
	fileUploaderCaseSessionKeyForField,
	type UploadDocumentRequest
} from '../controller.ts';

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
			}
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
	let relevantFileUploadQuestionConfigs = journeyFileUploadQuestionConfigs[journeyId];
	if (journeyId == 'gateway-3') {
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
	for (const questionConfig of relevantFileUploadQuestionConfigs) {
		const documentSetId = documentSetIdsByFolderName.get(questionConfig.url);
		if (!documentSetId) {
			throw new Error(`Missing document set reference data for "${questionConfig.url}". Run the database static seed.`);
		}

		const uploadedFiles = await DocumentUtil.loadUploadedDocuments(service, currentCase.id, documentSetId);
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
