import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { seedGateway3DeclarationDocuments } from './seed-gateway-3-declaration.ts';

// prettier-ignore

try { loadEnvFile(path.resolve(__dirname, '../../.env')); } catch {/* ignore errors*/}

const PLAN_REFERENCE = 'PLAN-001';
const EXAMINATION_WEBSITE = 'https://example.com/examination-website';

export async function seedGateway3Submitted() {
	const dbClient = newDatabaseClient(loadConfig().db);

	try {
		await seedGateway3DeclarationDocuments();

		const currentCase = await dbClient.case.findUnique({
			where: { reference: PLAN_REFERENCE },
			select: { id: true }
		});

		if (!currentCase) {
			throw new Error(`Case ${PLAN_REFERENCE} must exist before seeding Gateway 3 submission`);
		}

		const submissionDate = new Date();

		await dbClient.gateway3Info.upsert({
			where: { caseId: currentCase.id },
			create: {
				caseId: currentCase.id,
				actualDate: submissionDate
			},
			update: {
				actualDate: submissionDate
			}
		});

		await dbClient.examinationInfo.upsert({
			where: { caseId: currentCase.id },
			create: {
				caseId: currentCase.id,
				examinationWebsite: EXAMINATION_WEBSITE
			},
			update: {
				examinationWebsite: EXAMINATION_WEBSITE
			}
		});

		return { reference: PLAN_REFERENCE, submissionDate };
	} finally {
		await dbClient.$disconnect();
	}
}

if (import.meta.main) {
	seedGateway3Submitted();
}
