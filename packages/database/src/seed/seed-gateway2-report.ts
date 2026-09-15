/* eslint-disable camelcase */
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';

const REPORT_DOCUMENT_SET_ID = 'g2-report';
const REPORT_SHARED_DATE = new Date('2026-09-02T12:00:00.000Z');

async function run() {
	const config = loadConfig();
	const dbClient = newDatabaseClient(config.db);
	const reference = process.argv[2] || 'PLAN-001';

	try {
		const planCase = await dbClient.case.findUnique({
			where: { reference },
			select: { id: true, reference: true }
		});

		if (!planCase) {
			throw new Error(`Case ${reference} not found`);
		}

		await dbClient.$transaction(async (tx) => {
			await tx.document.updateMany({
				where: {
					caseId: planCase.id,
					documentSetId: REPORT_DOCUMENT_SET_ID
				},
				data: {
					isDeleted: true
				}
			});

			const document = await tx.document.upsert({
				where: {
					name_documentSetId: {
						name: `Gateway 2 report ${planCase.reference}`,
						documentSetId: REPORT_DOCUMENT_SET_ID
					}
				},
				update: {
					caseId: planCase.id,
					isDeleted: false
				},
				create: {
					name: `Gateway 2 report ${planCase.reference}`,
					caseId: planCase.id,
					documentSetId: REPORT_DOCUMENT_SET_ID,
					createdAt: REPORT_SHARED_DATE
				}
			});

			await tx.documentVersion.upsert({
				where: {
					documentGuid_version: {
						documentGuid: document.guid,
						version: 1
					}
				},
				update: {
					sourceSystem: 'back-office',
					virusCheckStatus: 'scanned',
					originalFilename: 'gateway-2-report.pdf',
					fileName: 'gateway-2-report.pdf',
					owner: 'back-office',
					mime: 'application/pdf',
					size: 1024,
					blobStorageContainer: 'cypress-documents',
					blobStoragePath: `${planCase.reference}/gateway-2-report.pdf`,
					documentURI: `https://example.test/${planCase.reference}/gateway-2-report.pdf`,
					dateCreated: REPORT_SHARED_DATE,
					isDeleted: false
				},
				create: {
					documentGuid: document.guid,
					version: 1,
					lastModified: REPORT_SHARED_DATE,
					sourceSystem: 'back-office',
					virusCheckStatus: 'scanned',
					originalFilename: 'gateway-2-report.pdf',
					fileName: 'gateway-2-report.pdf',
					owner: 'back-office',
					mime: 'application/pdf',
					size: 1024,
					blobStorageContainer: 'cypress-documents',
					blobStoragePath: `${planCase.reference}/gateway-2-report.pdf`,
					documentURI: `https://example.test/${planCase.reference}/gateway-2-report.pdf`,
					dateCreated: REPORT_SHARED_DATE,
					isDeleted: false
				}
			});

			await tx.document.update({
				where: { guid: document.guid },
				data: {
					latestVersionId: 1,
					isDeleted: false
				}
			});

			await tx.gateway2Info.upsert({
				where: { caseId: planCase.id },
				update: {
					reportIssuedDate: REPORT_SHARED_DATE
				},
				create: {
					caseId: planCase.id,
					reportIssuedDate: REPORT_SHARED_DATE
				}
			});
		});
	} finally {
		await dbClient.$disconnect();
	}
}

run().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
