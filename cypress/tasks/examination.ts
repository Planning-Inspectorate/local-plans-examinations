import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { newDatabaseClient } from '../../packages/database/src/index.ts';
import { seedCy } from '../../packages/database/src/seed/seed-cy.ts';
import { loadConfig as loadDatabaseConfig } from '../../packages/database/src/configuration/config.ts';
import {
	DOCUMENT_SET_ID,
	DOCUMENT_SOURCE_SYSTEM_ID,
	GATEWAY_3_DECISION_ID,
	VIRUS_CHECK_STATUS_ID
} from '../../packages/database/src/seed/static-data/ids/index.ts';
import { loadConfig } from '../../apps/manage/src/app/config.ts';
import { BlobFileStorageAdapter } from '../../packages/lib/storage/blob-storage.ts';
import { examinationReport, soundUnsound } from '../fixtures/manage/examination.ts';

export type ExaminationReportSeedOptions = {
	state?: 'empty' | 'awaiting-confirmation' | 'issued';
	fileNames?: string[];
};

function reportStorage() {
	if (process.env.ENVIRONMENT_SMOKE === 'true') {
		throw new Error('Examination report seeds are only for the isolated regression database');
	}
	return new BlobFileStorageAdapter({ ...loadConfig().blobStorage, basePath: 'examination' });
}

export async function seedExaminationReport({
	state = 'empty',
	fileNames = [examinationReport.fileName]
}: ExaminationReportSeedOptions = {}) {
	const storage = reportStorage();
	const seededCase = await seedCy();
	const db = newDatabaseClient(loadDatabaseConfig().db);
	try {
		const { id: caseId } = await db.case.findUniqueOrThrow({ where: { reference: seededCase.reference } });
		await db.examinationInfo.delete({ where: { caseId } });
		await db.examinationInfo.create({
			data: {
				caseId,
				submissionForExaminationDate: new Date('2026-09-01T12:00:00.000Z'),
				examiningInspector1: 'inspector-1',
				isSound: state === 'empty' ? null : soundUnsound.value,
				soundUnsoundDate: state === 'issued' ? new Date(examinationReport.issuedDate) : null
			}
		});
		await db.gateway3Submission.updateMany({
			where: { gateway3Info: { caseId } },
			data: { decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION, completionDate: new Date('2026-09-01') }
		});

		if (state !== 'empty') {
			for (const fileName of fileNames) {
				const buffer = await readFile(path.resolve('cypress/fixtures/files', fileName));
				const file = await storage.upload(
					{
						originalname: fileName,
						mimetype: fileName.endsWith('.pdf')
							? 'application/pdf'
							: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
						size: buffer.length,
						buffer
					},
					{ folderPath: `${caseId}/${examinationReport.path}`, metadata: { caseId } }
				);
				const guid = randomUUID();
				await db.document.create({
					data: {
						guid,
						name: file.id,
						caseId,
						documentSetId: DOCUMENT_SET_ID.EXAMINATION_REPORT,
						versions: {
							create: {
								version: 1,
								originalFilename: file.fileName,
								fileName: file.fileName,
								mime: file.mimeType,
								size: file.size,
								blobStorageContainer: file.containerName,
								blobStoragePath: file.path,
								dateCreated: new Date(examinationReport.receivedDate),
								sourceSystem: DOCUMENT_SOURCE_SYSTEM_ID.BACK_OFFICE,
								virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED
							}
						}
					}
				});
				await db.document.update({ where: { guid }, data: { latestVersionId: 1 } });
			}
		}
		if (state === 'issued') {
			await db.caseHistory.createMany({
				data: [
					{
						caseId,
						event: `Examination report issued on ${examinationReport.issuedDisplay}`,
						username: 'Local Plan User'
					},
					{ caseId, event: `Report issued updated to ${examinationReport.issuedDisplay}`, username: 'Local Plan User' }
				]
			});
		}
		return seededCase;
	} finally {
		await db.$disconnect();
	}
}

export async function clearExaminationReportFiles(reference: string) {
	const storage = reportStorage();
	const db = newDatabaseClient(loadDatabaseConfig().db);
	try {
		const currentCase = await db.case.findUnique({ where: { reference }, select: { id: true } });
		const documentCount = currentCase
			? await db.document.count({
					where: { caseId: currentCase.id, documentSetId: DOCUMENT_SET_ID.EXAMINATION_REPORT }
				})
			: 0;
		if (currentCase && documentCount > 0) {
			const files = await storage.list({ folderPath: `${currentCase.id}/${examinationReport.path}/` });
			for (const file of files) {
				await storage.delete(file);
			}
		}
		return null;
	} finally {
		await db.$disconnect();
	}
}
