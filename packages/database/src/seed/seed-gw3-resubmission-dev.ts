/**
 * Advances PLAN-001 to Gateway 3 resubmission-required state.
 *
 * Default (single resubmission):
 *   npx tsx packages/database/src/seed/seed-gw3-resubmission-dev.ts
 *   → Submission 1 (completed, RESUBMISSION_REQUIRED) + report + required docs
 *   → Submission 2 (placeholder)
 *
 * Multiple resubmissions (for LP-917 previous-submissions testing):
 *   SUBMISSIONS=3 npx tsx packages/database/src/seed/seed-gw3-resubmission-dev.ts
 *   → Submission 1 (completed, RESUBMISSION_REQUIRED) + report + required docs
 *   → Submission 2 (completed, RESUBMISSION_REQUIRED) + resubmission docs + report
 *   → Submission 3 (placeholder)
 *
 * Prerequisites: Run the OTP seed first (seed-gw3-dev is not required).
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
const TOTAL_SUBMISSIONS = Number(process.env.SUBMISSIONS ?? '2');

// Submission 1 dates
const SUBMISSION_1_DATE = new Date('2026-10-01T12:00:00.000Z');
const REPORT_1_DATE = new Date('2026-10-15T12:00:00.000Z');

// Submission 2 dates (used when SUBMISSIONS >= 3)
const SUBMISSION_2_DATE = new Date('2026-10-20T14:30:00.000Z');
const REPORT_2_DATE = new Date('2026-11-01T10:00:00.000Z');

// Required GW3 documents from the initial submission
const REQUIRED_DOCUMENTS = [
	{
		setId: DOCUMENT_SET_ID.G3_PROPOSED_LOCAL_PLAN,
		name: 'proposed-local-plan.pdf',
		guid: 'a1000001-0000-0000-0000-000000000001'
	},
	{
		setId: DOCUMENT_SET_ID.G3_MAP_OF_POLICIES,
		name: 'map-of-policies.pdf',
		guid: 'a1000001-0000-0000-0000-000000000002'
	},
	{
		setId: DOCUMENT_SET_ID.G3_STATEMENT_OF_COMPLIANCE,
		name: 'statement-of-compliance.pdf',
		guid: 'a1000001-0000-0000-0000-000000000003'
	},
	{
		setId: DOCUMENT_SET_ID.G3_STATEMENT_OF_SOUNDNESS,
		name: 'statement-of-soundness.pdf',
		guid: 'a1000001-0000-0000-0000-000000000004'
	},
	{
		setId: DOCUMENT_SET_ID.G3_CONSULTATION_ENGAGEMENT_SUMMARY,
		name: 'consultation-engagement.pdf',
		guid: 'a1000001-0000-0000-0000-000000000005'
	},
	{
		setId: DOCUMENT_SET_ID.G3_SCOPING_CONSULTATION_SUMMARY,
		name: 'scoping-consultation.pdf',
		guid: 'a1000001-0000-0000-0000-000000000006'
	},
	{
		setId: DOCUMENT_SET_ID.G3_CONSULTATION_CONTENT_EVIDENCE_SUMMARY,
		name: 'consultation-content-evidence.pdf',
		guid: 'a1000001-0000-0000-0000-000000000007'
	},
	{
		setId: DOCUMENT_SET_ID.G3_CONSULTATION_PROPOSED_PLAN_SUMMARY,
		name: 'consultation-proposed-plan.pdf',
		guid: 'a1000001-0000-0000-0000-000000000008'
	},
	{
		setId: DOCUMENT_SET_ID.G3_PRACTICAL_ARRANGEMENTS_STATEMENT,
		name: 'practical-arrangements.pdf',
		guid: 'a1000001-0000-0000-0000-000000000009'
	}
];

async function createDocument(
	dbClient: ReturnType<typeof newDatabaseClient>,
	caseId: string,
	guid: string,
	name: string,
	documentSetId: string,
	sourceSystem: string,
	dateCreated: Date
) {
	await dbClient.document.upsert({
		where: { guid },
		update: {},
		create: {
			guid,
			name,
			caseId,
			documentSetId,
			versions: {
				create: {
					version: 1,
					originalFilename: name,
					fileName: name,
					sourceSystem,
					virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED,
					dateCreated
				}
			}
		}
	});
	await dbClient.document.update({
		where: { guid },
		data: { latestVersionId: 1 }
	});
}

async function run() {
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

		// Create gateway3Info if it doesn't exist
		let gateway3InfoId = caseRecord.gateway3Info?.id;
		if (!gateway3InfoId) {
			const g3 = await dbClient.gateway3Info.create({
				data: { caseId: caseRecord.id }
			});
			gateway3InfoId = g3.id;
		}

		// Clean up existing submissions and documents for idempotency
		await dbClient.gateway3Submission.deleteMany({
			where: { gateway3InfoId }
		});
		await dbClient.gateway3Info.update({
			where: { id: gateway3InfoId },
			data: { actualDate: null }
		});
		await dbClient.case.update({
			where: { id: caseRecord.id },
			data: { submissionDate: null }
		});

		// Set the examination website (required text field for GW3 submission)
		await dbClient.examinationInfo.upsert({
			where: { caseId: caseRecord.id },
			update: { examinationWebsite: 'https://www.example.com/examination' },
			create: { caseId: caseRecord.id, examinationWebsite: 'https://www.example.com/examination' }
		});

		// --- Submission 1: completed with RESUBMISSION_REQUIRED ---
		await dbClient.gateway3Submission.create({
			data: {
				gateway3InfoId,
				completionDate: SUBMISSION_1_DATE,
				decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
			}
		});

		// Submission 1 report (BO document in g3-document-1)
		await createDocument(
			dbClient,
			caseRecord.id,
			'b2c3d4e5-f6a7-8901-bcde-f12345678901',
			'GW3Report-Submission1.pdf',
			DOCUMENT_SET_ID.G3_DOCUMENT_1,
			DOCUMENT_SOURCE_SYSTEM_ID.BACK_OFFICE,
			REPORT_1_DATE
		);

		// Required documents from the initial submission
		for (const doc of REQUIRED_DOCUMENTS) {
			await createDocument(
				dbClient,
				caseRecord.id,
				doc.guid,
				doc.name,
				doc.setId,
				DOCUMENT_SOURCE_SYSTEM_ID.BACK_OFFICE,
				SUBMISSION_1_DATE
			);
		}

		if (TOTAL_SUBMISSIONS >= 3) {
			// --- Submission 2: completed with RESUBMISSION_REQUIRED ---
			await dbClient.gateway3Submission.create({
				data: {
					gateway3InfoId,
					completionDate: SUBMISSION_2_DATE,
					decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
				}
			});

			// Resubmission documents uploaded by the LPA for submission 2 (in g3-document-2)
			await createDocument(
				dbClient,
				caseRecord.id,
				'c3d4e5f6-a7b8-9012-cdef-234567890001',
				'updated-proposed-plan-v2.pdf',
				DOCUMENT_SET_ID.G3_DOCUMENT_2,
				DOCUMENT_SOURCE_SYSTEM_ID.FRONT_OFFICE,
				SUBMISSION_2_DATE
			);
			await createDocument(
				dbClient,
				caseRecord.id,
				'c3d4e5f6-a7b8-9012-cdef-234567890002',
				'additional-evidence-v2.pdf',
				DOCUMENT_SET_ID.G3_DOCUMENT_2,
				DOCUMENT_SOURCE_SYSTEM_ID.FRONT_OFFICE,
				SUBMISSION_2_DATE
			);

			// Submission 2 report (BO document in g3-document-2) — triggers submission 3
			await createDocument(
				dbClient,
				caseRecord.id,
				'c3d4e5f6-a7b8-9012-cdef-234567890010',
				'GW3Report-Submission2.pdf',
				DOCUMENT_SET_ID.G3_DOCUMENT_2,
				DOCUMENT_SOURCE_SYSTEM_ID.BACK_OFFICE,
				REPORT_2_DATE
			);
		}

		// --- Placeholder for the next resubmission ---
		await dbClient.gateway3Submission.create({
			data: {
				gateway3InfoId,
				completionDate: null,
				decision: null
			}
		});

		logger.info(
			`${CASE_REFERENCE} now has ${TOTAL_SUBMISSIONS - 1} completed Gateway 3 submission(s) ` +
				`with placeholder submission ${TOTAL_SUBMISSIONS}`
		);
	} finally {
		await dbClient.$disconnect();
	}
}

run();
