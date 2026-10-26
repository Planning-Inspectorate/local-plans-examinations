import { randomUUID } from 'node:crypto';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import {
	DOCUMENT_SET_ID,
	DOCUMENT_SOURCE_SYSTEM_ID,
	GATEWAY_3_DECISION_ID,
	VIRUS_CHECK_STATUS_ID
} from './static-data/ids/index.ts';

const PLAN_REFERENCE = 'PLAN-001';

// Simulates a BO user requesting another resubmission after the LPA has submitted their latest resubmission in FO

export async function seedGateway3TriggerResubmission({
	reportFileNames = ['GW3Report.pdf']
}: { reportFileNames?: string[] } = {}) {
	const dbClient = newDatabaseClient(loadConfig().db);

	try {
		const currentCase = await dbClient.case.findUnique({
			where: { reference: PLAN_REFERENCE },
			select: {
				id: true,
				gateway3Info: { select: { id: true, submissions: true } }
			}
		});

		const gateway3Info = currentCase?.gateway3Info;
		const latestSubmission = gateway3Info?.submissions.find(
			(submission) => !submission.completionDate && !submission.decision
		);

		if (!currentCase || !gateway3Info || !latestSubmission) {
			throw new Error(`Case ${PLAN_REFERENCE} must have a Gateway 3 submission before triggering a resubmission`);
		}

		const submissionNumber = gateway3Info.submissions.length;
		const documentSetId = DOCUMENT_SET_ID[`G3_DOCUMENT_${submissionNumber}`];
		const now = new Date();

		await dbClient.gateway3Submission.update({
			where: { id: latestSubmission.id },
			data: {
				completionDate: latestSubmission.completionDate ?? now,
				decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
			}
		});

		// Point the BO report at the LPA's uploaded file so its download link works locally
		const lpaUpload = await dbClient.document.findFirst({
			where: { caseId: currentCase.id, documentSetId, isDeleted: false },
			select: { latestDocumentVersion: { select: { blobStorageContainer: true, blobStoragePath: true } } }
		});

		await dbClient.document.updateMany({
			where: { caseId: currentCase.id, documentSetId, isDeleted: false },
			data: { isDeleted: true }
		});

		for (const fileName of reportFileNames) {
			const guid = randomUUID();
			await dbClient.document.create({
				data: {
					guid,
					name: fileName,
					caseId: currentCase.id,
					documentSetId,
					versions: {
						create: {
							version: 1,
							originalFilename: fileName,
							fileName,
							sourceSystem: DOCUMENT_SOURCE_SYSTEM_ID.BACK_OFFICE,
							virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED,
							dateCreated: now,
							blobStorageContainer: lpaUpload?.latestDocumentVersion?.blobStorageContainer,
							blobStoragePath: lpaUpload?.latestDocumentVersion?.blobStoragePath
						}
					}
				}
			});
			await dbClient.document.update({ where: { guid }, data: { latestVersionId: 1 } });
		}

		await dbClient.gateway3Submission.create({
			data: { gateway3InfoId: gateway3Info.id, completionDate: null, decision: null }
		});

		return { reference: PLAN_REFERENCE, nextSubmissionNumber: submissionNumber + 1 };
	} finally {
		await dbClient.$disconnect();
	}
}
