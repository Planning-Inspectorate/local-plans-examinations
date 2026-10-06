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
const REPORT_DATE = new Date('2026-10-15T12:00:00.000Z');
const REPORT_DOCUMENT_GUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const REPORT_DOCUMENT_NAME = 'GW3Report-PLAN-001.pdf';
const CREATE_PLACEHOLDER = process.env.CREATE_PLACEHOLDER !== 'false';

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

		if (!caseRecord.gateway3Info) {
			logger.error(`Case ${CASE_REFERENCE} has no gateway3Info. Run seed-gw3-dev first.`);
			process.exit(1);
		}

		// Remove any existing submissions so the seed is idempotent
		await dbClient.gateway3Submission.deleteMany({
			where: { gateway3InfoId: caseRecord.gateway3Info.id }
		});

		// Create the first completed submission with resubmission decision
		const firstSubmission = await dbClient.gateway3Submission.create({
			data: {
				gateway3InfoId: caseRecord.gateway3Info.id,
				completionDate: SUBMISSION_1_DATE,
				decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED
			}
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
						dateCreated: REPORT_DATE
					}
				}
			}
		});
		await dbClient.document.update({
			where: { guid: REPORT_DOCUMENT_GUID },
			data: { latestVersionId: 1 }
		});

		if (CREATE_PLACEHOLDER) {
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
