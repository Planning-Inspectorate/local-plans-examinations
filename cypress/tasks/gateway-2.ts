import { randomUUID } from 'node:crypto';
import { newDatabaseClient } from '../../packages/database/src/index.ts';
import { loadConfig } from '../../packages/database/src/configuration/config.ts';
import {
	DOCUMENT_SET_ID,
	DOCUMENT_SOURCE_SYSTEM_ID,
	VIRUS_CHECK_STATUS_ID
} from '../../packages/database/src/seed/static-data/ids/index.ts';
import { gateway2SubmittedPlan } from '../fixtures/portal/gateway-2-uploads.ts';

export async function seedGateway2SubmittedDocuments() {
	if (process.env.ENVIRONMENT_SMOKE === 'true') {
		throw new Error('Submitted Gateway 2 document seeds are only for the isolated regression database');
	}
	const db = newDatabaseClient(loadConfig().db);
	try {
		const currentCase = await db.case.findUniqueOrThrow({
			where: { reference: gateway2SubmittedPlan.reference },
			select: { id: true, submissionDate: true }
		});
		if (!currentCase.submissionDate) {
			throw new Error(`Case ${gateway2SubmittedPlan.reference} must already be submitted`);
		}

		// Content checks need document metadata; file transfers remain covered by upload/download journeys.
		const documentGroups = [
			{ documentSetId: DOCUMENT_SET_ID.G2_COVER_LETTER, fileNames: [gateway2SubmittedPlan.coveringLetter] },
			{ documentSetId: DOCUMENT_SET_ID.G2_LOCAL_PLAN_TIMETABLE, fileNames: gateway2SubmittedPlan.timetableFiles }
		];
		for (const { documentSetId, fileNames } of documentGroups) {
			for (const fileName of fileNames) {
				const guid = randomUUID();
				await db.document.create({
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
								dateCreated: currentCase.submissionDate,
								sourceSystem: DOCUMENT_SOURCE_SYSTEM_ID.FRONT_OFFICE,
								virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED
							}
						}
					}
				});
				await db.document.update({ where: { guid }, data: { latestVersionId: 1 } });
			}
		}
		return null;
	} finally {
		await db.$disconnect();
	}
}
