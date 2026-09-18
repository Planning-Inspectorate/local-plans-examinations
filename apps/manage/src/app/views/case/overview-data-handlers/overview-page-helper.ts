import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { ManageService } from '#service';
import type { Request } from 'express';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import {
	fileUploadQuestionConfigs,
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

export async function addUploadedDocumentDetailsToAnswers(
	service: ManageService,
	currentCase: any,
	req: Request,
	answers: any
) {
	const request = req as UploadDocumentRequest;
	request.currentCase = currentCase;
	const documentSetIdsByFolderName = await DocumentUtil.getDocumentSetIdsByFolderName(
		service,
		fileUploadQuestionConfigs.map((questionConfig) => questionConfig.url)
	);
	for (const questionConfig of fileUploadQuestionConfigs) {
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
