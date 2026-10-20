/**
 * Simulates the BO triggering another resubmission for PLAN-001.
 *
 * Run this AFTER you have submitted a resubmission in the portal.
 * It marks the latest submission as "resubmission required" and creates
 * a new placeholder submission, so the portal shows the next resubmission page.
 *
 * Usage:
 *   npx tsx packages/database/src/seed/seed-trigger-resubmission.ts
 */
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { GATEWAY_3_DECISION_ID } from './static-data/ids/index.ts';
import { loadSeedEnv } from './load-env.ts';
import { initLogger } from '@planning-inspectorate/core/util';

loadSeedEnv();

const logger = initLogger({ logLevel: 'info', NODE_ENV: 'development' });
const CASE_REFERENCE = 'PLAN-001';

async function main() {
	const config = loadConfig();
	const db = newDatabaseClient(config.db);

	try {
		const caseRecord = await db.case.findUnique({
			where: { reference: CASE_REFERENCE },
			include: {
				gateway3Info: {
					include: { submissions: { orderBy: { id: 'asc' } } }
				}
			}
		});

		if (!caseRecord?.gateway3Info) {
			logger.error(`Case ${CASE_REFERENCE} not found or missing gateway3Info.`);
			process.exit(1);
		}

		const submissions = caseRecord.gateway3Info.submissions;
		const latest = submissions.at(-1);

		if (!latest) {
			logger.error('No submissions found.');
			process.exit(1);
		}

		// If latest is a placeholder (no completionDate), complete it first
		if (!latest.completionDate) {
			logger.info(`Latest submission (id: ${latest.id}) has no completionDate — completing it now.`);
			await db.gateway3Submission.update({
				where: { id: latest.id },
				data: { completionDate: new Date() }
			});
		}

		// Mark latest as resubmission required
		await db.gateway3Submission.update({
			where: { id: latest.id },
			data: { decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED }
		});

		// Create new placeholder for the next resubmission
		await db.gateway3Submission.create({
			data: {
				gateway3InfoId: caseRecord.gateway3Info.id,
				completionDate: null,
				decision: null
			}
		});

		const nextNumber = submissions.length + 1;
		logger.info(
			`Done. Submission ${submissions.length} marked as resubmission required. Submission ${nextNumber} placeholder created.`
		);
		logger.info(`Refresh the portal to see "Gateway 3; submission ${nextNumber}".`);
	} finally {
		await db.$disconnect();
	}
}

main();
