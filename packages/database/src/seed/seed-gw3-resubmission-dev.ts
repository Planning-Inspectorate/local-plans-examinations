/**
 * Advances PLAN-001 to Gateway 3 resubmission-required state by:
 * 1. Creating a Gateway3Submission with decision = RESUBMISSION_REQUIRED and a completed date
 * 2. Creating the GW3 report document in the g3-document-1 document set
 * 3. Optionally creating a second empty Gateway3Submission (BO resubmission placeholder)
 *
 * Run with placeholder:
 *   npx tsx packages/database/src/seed/seed-gw3-resubmission-dev.ts
 * Run without placeholder (simpler portal-only test):
 *   CREATE_PLACEHOLDER=false npx tsx packages/database/src/seed/seed-gw3-resubmission-dev.ts
 *
 * Prerequisites: Run the OTP seed and seed-gw3-dev first.
 */
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import {
	DOCUMENT_SET_ID,
	DOCUMENT_SOURCE_SYSTEM_ID,
	GATEWAY_3_DECISION_ID,
	VIRUS_CHECK_STATUS_ID
} from './static-data/ids/index.ts';
import { loadSeedEnv } from './load-env.ts';
import { initLogger } from '@planning-inspectorate/core/util';

loadSeedEnv();

const logger = initLogger({ logLevel: 'info', NODE_ENV: 'development' });

const CASE_REFERENCE = 'PLAN-001';
const SUBMISSION_1_DATE = new Date('2026-10-01T12:00:00.000Z');
const SUBMISSION_2_DATE = new Date('2026-10-12T14:30:00.000Z');
const REPORT_1_DATE = new Date('2026-10-15T12:00:00.000Z');
const REPORT_2_DATE = new Date('2026-10-18T12:00:00.000Z');
const REPORT_DOCUMENT_GUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const REPORT_DOCUMENT_NAME = 'GW3Report-PLAN-001.pdf';
const REPORT_1B_DOCUMENT_GUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678902';
const REPORT_1B_DOCUMENT_NAME = 'GW3Report-Addendum-PLAN-001.pdf';
const REPORT_2_DOCUMENT_GUID = 'c3d4e5f6-a7b8-9012-cdef-234567890123';
const REPORT_2_DOCUMENT_NAME = 'GW3Report2-PLAN-001.pdf';
const RESUB_DOC_1_GUID = 'd4e5f6a7-b8c9-0123-defa-345678901234';
const RESUB_DOC_2_GUID = 'e5f6a7b8-c9d0-1234-efab-456789012345';
const CREATE_PLACEHOLDER = process.env.CREATE_PLACEHOLDER !== 'false';
const SEED_SUBMISSION_3 = process.env.SEED_SUBMISSION_3 === 'true';

/** Required GW3 document sets that must have at least one document for the declaration guard to pass. */
const REQUIRED_DOC_SETS = [
	{ id: DOCUMENT_SET_ID.G3_PROPOSED_LOCAL_PLAN, name: 'proposed-local-plan.pdf' },
	{ id: DOCUMENT_SET_ID.G3_MAP_OF_POLICIES, name: 'map-of-policies.pdf' },
	{ id: DOCUMENT_SET_ID.G3_STATEMENT_OF_COMPLIANCE, name: 'statement-of-compliance.pdf' },
	{ id: DOCUMENT_SET_ID.G3_STATEMENT_OF_SOUNDNESS, name: 'statement-of-soundness.pdf' },
	{ id: DOCUMENT_SET_ID.G3_CONSULTATION_ENGAGEMENT_SUMMARY, name: 'consultation-engagement-summary.pdf' },
	{ id: DOCUMENT_SET_ID.G3_SCOPING_CONSULTATION_SUMMARY, name: 'scoping-consultation-summary.pdf' },
	{ id: DOCUMENT_SET_ID.G3_CONSULTATION_CONTENT_EVIDENCE_SUMMARY, name: 'consultation-content-evidence-summary.pdf' },
	{ id: DOCUMENT_SET_ID.G3_CONSULTATION_PROPOSED_PLAN_SUMMARY, name: 'consultation-proposed-plan-summary.pdf' },
	{ id: DOCUMENT_SET_ID.G3_PRACTICAL_ARRANGEMENTS_STATEMENT, name: 'practical-arrangements-statement.pdf' }
];

export async function run() {
	const config = loadConfig();
	const dbClient = newDatabaseClient(config.db);

	try {
		const caseRecord = await dbClient.case.findUnique({
			where: { reference: CASE_REFERENCE },
			include: { gateway3Info: true }
		});

		if (!caseRecord) {
			logger.error(`Case ${CASE_REFERENCE} not found. Run the OTP seed first.`);
			process.exit(1);
		}

		if (!caseRecord.gateway3Info) {
			logger.error(`Case ${CASE_REFERENCE} has no gateway3Info. Run seed-gw3-dev first.`);
			process.exit(1);
		}

		// Remove any existing submissions and set actualDate so the seed is idempotent
		await dbClient.gateway3Submission.deleteMany({
			where: { gateway3InfoId: caseRecord.gateway3Info.id }
		});
		await dbClient.gateway3Info.update({
			where: { id: caseRecord.gateway3Info.id },
			data: { actualDate: SUBMISSION_1_DATE }
		});
		await dbClient.case.update({
			where: { id: caseRecord.id },
			data: { submissionDate: null }
		});

		// Create the first completed submission with resubmission decision
		const firstSubmission = await dbClient.gateway3Submission.create({
			data: {
				gateway3InfoId: caseRecord.gateway3Info.id,
				completionDate: SUBMISSION_1_DATE,
				decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
			}
		});

		// Seed required GW3 documents so the declaration guard passes
		for (let i = 0; i < REQUIRED_DOC_SETS.length; i++) {
			const docSet = REQUIRED_DOC_SETS[i];
			// Generate a deterministic UUID for each required doc
			const guid = `a0a0a0a0-0000-4000-8000-00000000000${i}`;
			await dbClient.document.upsert({
				where: { guid },
				update: {},
				create: {
					guid,
					name: docSet.name,
					caseId: caseRecord.id,
					documentSetId: docSet.id,
					versions: {
						create: {
							version: 1,
							originalFilename: docSet.name,
							fileName: docSet.name,
							sourceSystem: DOCUMENT_SOURCE_SYSTEM_ID.PORTAL,
							virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED,
							dateCreated: SUBMISSION_1_DATE
						}
					}
				}
			});
			await dbClient.document.update({ where: { guid }, data: { latestVersionId: 1 } });
		}

		// Set examination website URL so the declaration guard passes
		await dbClient.gateway3Info.update({
			where: { id: caseRecord.gateway3Info.id },
			data: { examinationWebsiteUrl: 'https://example.com/examination' }
		});

		// Create the GW3 report document in the g3-document-1 document set
		await dbClient.document.upsert({
			where: { guid: REPORT_DOCUMENT_GUID },
			update: {},
			create: {
				guid: REPORT_DOCUMENT_GUID,
				name: REPORT_DOCUMENT_NAME,
				caseId: caseRecord.id,
				documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_1,
				versions: {
					create: {
						version: 1,
						originalFilename: REPORT_DOCUMENT_NAME,
						fileName: REPORT_DOCUMENT_NAME,
						sourceSystem: DOCUMENT_SOURCE_SYSTEM_ID.BACK_OFFICE,
						virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED,
						dateCreated: REPORT_1_DATE
					}
				}
			}
		});
		await dbClient.document.update({
			where: { guid: REPORT_DOCUMENT_GUID },
			data: { latestVersionId: 1 }
		});

		// Create a second report document in g3-document-1 (for testing Bug 1: multiple report docs)
		await dbClient.document.upsert({
			where: { guid: REPORT_1B_DOCUMENT_GUID },
			update: {},
			create: {
				guid: REPORT_1B_DOCUMENT_GUID,
				name: REPORT_1B_DOCUMENT_NAME,
				caseId: caseRecord.id,
				documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_1,
				versions: {
					create: {
						version: 1,
						originalFilename: REPORT_1B_DOCUMENT_NAME,
						fileName: REPORT_1B_DOCUMENT_NAME,
						sourceSystem: DOCUMENT_SOURCE_SYSTEM_ID.BACK_OFFICE,
						virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED,
						dateCreated: REPORT_1_DATE
					}
				}
			}
		});
		await dbClient.document.update({
			where: { guid: REPORT_1B_DOCUMENT_GUID },
			data: { latestVersionId: 1 }
		});

		if (SEED_SUBMISSION_3) {
			// Submission 2: completed with resubmission required decision
			await dbClient.gateway3Submission.create({
				data: {
					gateway3InfoId: caseRecord.gateway3Info.id,
					completionDate: SUBMISSION_2_DATE,
					decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
				}
			});

			// Documents uploaded by LPA during submission 2 (in g3-document-2).
			// In production these are soft-deleted when the BO uploads their report
			// to the same set via syncDocuments, so mark them as deleted here.
			for (const [guid, name] of [
				[RESUB_DOC_1_GUID, 'Test File.docx'],
				[RESUB_DOC_2_GUID, 'Test File.jpg']
			] as const) {
				await dbClient.document.upsert({
					where: { guid },
					update: { isDeleted: true },
					create: {
						guid,
						name,
						caseId: caseRecord.id,
						documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_2,
						isDeleted: true,
						versions: {
							create: {
								version: 1,
								originalFilename: name,
								fileName: name,
								sourceSystem: DOCUMENT_SOURCE_SYSTEM_ID.PORTAL,
								virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED,
								dateCreated: SUBMISSION_2_DATE,
								isDeleted: true
							}
						}
					}
				});
				await dbClient.document.update({ where: { guid }, data: { latestVersionId: 1 } });
			}

			// Report for submission 2 (in g3-document-2, uploaded by BO)
			await dbClient.document.upsert({
				where: { guid: REPORT_2_DOCUMENT_GUID },
				update: {},
				create: {
					guid: REPORT_2_DOCUMENT_GUID,
					name: REPORT_2_DOCUMENT_NAME,
					caseId: caseRecord.id,
					documentSetId: DOCUMENT_SET_ID.G3_DOCUMENT_2,
					versions: {
						create: {
							version: 1,
							originalFilename: REPORT_2_DOCUMENT_NAME,
							fileName: REPORT_2_DOCUMENT_NAME,
							sourceSystem: DOCUMENT_SOURCE_SYSTEM_ID.BACK_OFFICE,
							virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED,
							dateCreated: REPORT_2_DATE
						}
					}
				}
			});
			await dbClient.document.update({
				where: { guid: REPORT_2_DOCUMENT_GUID },
				data: { latestVersionId: 1 }
			});

			// Submission 3: placeholder (awaiting resubmission)
			await dbClient.gateway3Submission.create({
				data: {
					gateway3InfoId: caseRecord.gateway3Info.id,
					completionDate: null,
					decision: null
				}
			});

			logger.info(`${CASE_REFERENCE} now has Gateway 3 submission 3 resubmission required (with submission 2 docs)`);
		} else if (CREATE_PLACEHOLDER) {
			await dbClient.gateway3Submission.create({
				data: {
					gateway3InfoId: caseRecord.gateway3Info.id,
					completionDate: null,
					decision: null
				}
			});
			logger.info(`${CASE_REFERENCE} now has Gateway 3 resubmission required (with placeholder submission 2)`);
		} else {
			logger.info(`${CASE_REFERENCE} now has Gateway 3 resubmission required (submission 1 id: ${firstSubmission.id})`);
		}
	} finally {
		await dbClient.$disconnect();
	}
}

run();
