import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { DOCUMENT_SET_ID, DOCUMENT_SOURCE_SYSTEM_ID, VIRUS_CHECK_STATUS_ID } from './static-data/ids/index.ts';

// prettier-ignore
try { loadEnvFile(path.resolve(__dirname, '../../.env')); } catch {/* ignore errors*/}

const PLAN_REFERENCE = 'PLAN-001';
const REQUIRED_DOCUMENT_SET_IDS = [
	DOCUMENT_SET_ID.G3_PROPOSED_LOCAL_PLAN,
	DOCUMENT_SET_ID.G3_MAP_OF_POLICIES,
	DOCUMENT_SET_ID.G3_STATEMENT_OF_COMPLIANCE,
	DOCUMENT_SET_ID.G3_STATEMENT_OF_SOUNDNESS,
	DOCUMENT_SET_ID.G3_CONSULTATION_ENGAGEMENT_SUMMARY,
	DOCUMENT_SET_ID.G3_SCOPING_CONSULTATION_SUMMARY,
	DOCUMENT_SET_ID.G3_CONSULTATION_CONTENT_EVIDENCE_SUMMARY,
	DOCUMENT_SET_ID.G3_CONSULTATION_PROPOSED_PLAN_SUMMARY,
	DOCUMENT_SET_ID.G3_PRACTICAL_ARRANGEMENTS_STATEMENT
];

export async function seedGateway3DeclarationDocuments() {
	const dbClient = newDatabaseClient(loadConfig().db);

	try {
		const currentCase = await dbClient.case.findUnique({
			where: { reference: PLAN_REFERENCE },
			select: { id: true }
		});

		if (!currentCase) {
			throw new Error(`Case ${PLAN_REFERENCE} must be seeded before its Gateway 3 documents`);
		}

		for (const documentSetId of REQUIRED_DOCUMENT_SET_IDS) {
			const guid = randomUUID();
			const fileName = `${documentSetId}.pdf`;

			await dbClient.document.create({
				data: {
					guid,
					name: guid,
					caseId: currentCase.id,
					documentSetId,
					versions: {
						create: {
							version: 1,
							originalFilename: fileName,
							fileName,
							mime: 'application/pdf',
							size: 1,
							sourceSystem: DOCUMENT_SOURCE_SYSTEM_ID.FRONT_OFFICE,
							virusCheckStatus: VIRUS_CHECK_STATUS_ID.NOT_SCANNED
						}
					}
				}
			});

			await dbClient.document.update({
				where: { guid },
				data: { latestVersionId: 1 }
			});
		}

		return null;
	} finally {
		await dbClient.$disconnect();
	}
}

if (import.meta.main) {
	seedGateway3DeclarationDocuments();
}
