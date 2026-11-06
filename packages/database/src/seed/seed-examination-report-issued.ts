import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { seedExaminationInExamination } from './seed-examination-in-examination.ts';
import { EXAMINATION_STATUS_ID } from './static-data/ids/index.ts';

// prettier-ignore
try { loadEnvFile(path.resolve(__dirname, '../../.env')); } catch {/* ignore errors*/}

const PLAN_REFERENCE = 'PLAN-001';

export async function seedExaminationReportIssued() {
	const dbClient = newDatabaseClient(loadConfig().db);

	try {
		await seedExaminationInExamination();

		const currentCase = await dbClient.case.findUnique({
			where: { reference: PLAN_REFERENCE },
			select: { id: true }
		});

		if (!currentCase) {
			throw new Error(`Case ${PLAN_REFERENCE} must exist before seeding examination report issued`);
		}

		const submissionDate = new Date();
		const IS_SOUND_ANSWER = 'sound';

		await dbClient.examinationInfo.upsert({
			where: { caseId: currentCase.id },
			create: {
				caseId: currentCase.id,
				status: EXAMINATION_STATUS_ID.REPORT_ISSUED,
				finalReportIssueDate: submissionDate,
				isSound: IS_SOUND_ANSWER,
				soundUnsoundDate: submissionDate
			},
			update: {
				status: EXAMINATION_STATUS_ID.REPORT_ISSUED,
				finalReportIssueDate: submissionDate,
				isSound: IS_SOUND_ANSWER,
				soundUnsoundDate: submissionDate
			}
		});
		return { reference: PLAN_REFERENCE, submissionDate };
	} finally {
		await dbClient.$disconnect();
	}
}

if (import.meta.main) {
	seedExaminationReportIssued();
}
