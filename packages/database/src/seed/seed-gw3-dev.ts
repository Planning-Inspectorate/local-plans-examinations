/**
 * Advances PLAN-001 to Gateway 3 stage by:
 * 1. Setting reportIssuedDate on gateway2Info
 * 2. Creating a gateway 2 report document (required by hasIssuedGateway2Report)
 *
 * Run: npx tsx packages/database/src/seed/seed-gw3-dev.ts
 */
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { DOCUMENT_SET_ID, DOCUMENT_SOURCE_SYSTEM_ID, VIRUS_CHECK_STATUS_ID } from './static-data/ids/index.ts';
import { loadSeedEnv } from './load-env.ts';

loadSeedEnv();

const CASE_REFERENCE = 'PLAN-001';
const REPORT_ISSUED_DATE = new Date('2026-09-15T12:00:00.000Z');
const SUBMISSION_DATE = new Date('2026-09-12T12:00:00.000Z');
const DOCUMENT_GUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const DOCUMENT_NAME = 'GW2Report-PLAN-001.docx';

async function run() {
	const config = loadConfig();
	const dbClient = newDatabaseClient(config.db);

	try {
		// Find the case
		const caseRecord = await dbClient.case.findUnique({
			where: { reference: CASE_REFERENCE },
			select: { id: true }
		});

		if (!caseRecord) {
			console.error(`Case ${CASE_REFERENCE} not found. Run the OTP seed first.`);
			process.exit(1);
		}

		// Update gateway2Info to set reportIssuedDate and actualDate
		await dbClient.gateway2Info.update({
			where: { caseId: caseRecord.id },
			data: {
				actualDate: SUBMISSION_DATE,
				reportIssuedDate: REPORT_ISSUED_DATE
			}
		});
		console.log(`Updated gateway2Info for ${CASE_REFERENCE}: reportIssuedDate=${REPORT_ISSUED_DATE.toISOString()}`);

		// Create a gateway 2 report document (needed for hasIssuedGateway2Report)
		await dbClient.document.upsert({
			where: { guid: DOCUMENT_GUID },
			update: {},
			create: {
				guid: DOCUMENT_GUID,
				name: DOCUMENT_NAME,
				caseId: caseRecord.id,
				documentSetId: DOCUMENT_SET_ID.G2_REPORT,
				versions: {
					create: {
						version: 1,
						originalFilename: DOCUMENT_NAME,
						fileName: DOCUMENT_NAME,
						sourceSystem: DOCUMENT_SOURCE_SYSTEM_ID.BACK_OFFICE,
						virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED,
						dateCreated: REPORT_ISSUED_DATE
					}
				}
			}
		});
		await dbClient.document.update({
			where: { guid: DOCUMENT_GUID },
			data: { latestVersionId: 1 }
		});
		console.log(`Created gateway 2 report document for ${CASE_REFERENCE}`);

		console.log(`\n${CASE_REFERENCE} is now at Gateway 3 stage.`);
		console.log(`Navigate to: http://localhost:8080/manage-local-plans/your-plans`);
		console.log(`Click PLAN-001 -> Gateway 3 submission -> fill in documents -> Submit -> Declaration page`);
	} catch (error) {
		console.error('Error:', error);
		throw error;
	} finally {
		await dbClient.$disconnect();
	}
}

run();
