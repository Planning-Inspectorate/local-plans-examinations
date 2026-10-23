import { randomUUID } from 'node:crypto';
import { newDatabaseClient } from '../../packages/database/src/index.ts';
import { loadConfig } from '../../packages/database/src/configuration/config.ts';
import { seedCy } from '../../packages/database/src/seed/seed-cy.ts';
import {
	DOCUMENT_SET_ID,
	DOCUMENT_SOURCE_SYSTEM_ID,
	VIRUS_CHECK_STATUS_ID
} from '../../packages/database/src/seed/static-data/ids/index.ts';
import { gateway3RequiredSubmissionDocuments, type Gateway3SubmissionDocument } from '../fixtures/manage/gateway-3.ts';

export type Gateway3SubmissionDocumentsSeedOptions = {
	documents?: readonly Gateway3SubmissionDocument[];
};

/**
 * Seeds a manage case with Gateway 3 submission documents already added by the LPA.
 * Defaults to every required document, so the case can move on to a Gateway 3 decision.
 */
export async function seedGateway3SubmissionDocuments({
	documents = gateway3RequiredSubmissionDocuments
}: Gateway3SubmissionDocumentsSeedOptions = {}) {
	if (process.env.ENVIRONMENT_SMOKE === 'true') {
		throw new Error('Gateway 3 submission document seeds are only for the isolated regression database');
	}
	const seededCase = await seedCy();
	const db = newDatabaseClient(loadConfig().db);
	try {
		const { id: caseId } = await db.case.findUniqueOrThrow({
			where: { reference: seededCase.reference },
			select: { id: true }
		});

		// Content checks need document metadata; file transfers remain covered by the portal upload journeys.
		for (const { documentSetKey, fileName } of documents) {
			const documentSetId = DOCUMENT_SET_ID[documentSetKey];
			if (!documentSetId) {
				throw new Error(`Unknown Gateway 3 document set "${documentSetKey}"`);
			}
			const guid = randomUUID();
			await db.document.create({
				data: {
					guid,
					name: guid,
					caseId,
					documentSetId,
					versions: {
						create: {
							version: 1,
							originalFilename: fileName,
							fileName,
							mime: 'application/pdf',
							size: 1,
							sourceSystem: DOCUMENT_SOURCE_SYSTEM_ID.FRONT_OFFICE,
							virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED
						}
					}
				}
			});
			await db.document.update({ where: { guid }, data: { latestVersionId: 1 } });
		}
		return seededCase;
	} finally {
		await db.$disconnect();
	}
}
