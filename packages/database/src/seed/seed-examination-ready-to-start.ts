import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { EXAMINATION_STATUS_ID, GATEWAY_3_DECISION_ID } from './static-data/ids/index.ts';
import { seedGateway3Submitted } from './seed-gateway-3-submitted.ts';

// prettier-ignore
try { loadEnvFile(path.resolve(__dirname, '../../.env')); } catch {/* ignore errors*/}

const PLAN_REFERENCE = 'PLAN-001';

export async function seedExaminationReadyToStart() {
	await seedGateway3Submitted();

	const dbClient = newDatabaseClient(loadConfig().db);

	try {
		const currentCase = await dbClient.case.findUnique({
			where: { reference: PLAN_REFERENCE },
			select: { id: true, gateway3Info: { select: { id: true } } }
		});

		if (!currentCase?.gateway3Info) {
			throw new Error(`Case ${PLAN_REFERENCE} must have Gateway 3 info before seeding examination`);
		}

		const decisionDate = new Date();
		const decisionData = {
			decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION,
			completionDate: decisionDate
		};

		const { count } = await dbClient.gateway3Submission.updateMany({
			where: { gateway3InfoId: currentCase.gateway3Info.id, completionDate: null },
			data: decisionData
		});

		if (count === 0) {
			await dbClient.gateway3Submission.create({
				data: { gateway3InfoId: currentCase.gateway3Info.id, ...decisionData }
			});
		}

		await dbClient.examinationInfo.upsert({
			where: { caseId: currentCase.id },
			create: {
				caseId: currentCase.id,
				status: EXAMINATION_STATUS_ID.READY_TO_START
			},
			update: {
				status: EXAMINATION_STATUS_ID.READY_TO_START,
				submissionForExaminationDate: null
			}
		});

		return { reference: PLAN_REFERENCE, decisionDate };
	} finally {
		await dbClient.$disconnect();
	}
}

if (import.meta.main) {
	seedExaminationReadyToStart();
}
