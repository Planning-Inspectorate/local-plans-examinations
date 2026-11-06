import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { seedExaminationDeclarationDocuments } from '../seed/seed-examination-declaration.ts';
import { seedExaminationReadyToStart } from './seed-examination-ready-to-start.ts';
import { EXAMINATION_STATUS_ID } from './static-data/ids/index.ts';

// prettier-ignore
try { loadEnvFile(path.resolve(__dirname, '../../.env')); } catch {/* ignore errors*/}

const PLAN_REFERENCE = 'PLAN-001';

export async function seedExaminationInExamination() {
	const dbClient = newDatabaseClient(loadConfig().db);

	try {
		await seedExaminationReadyToStart();
		await seedExaminationDeclarationDocuments();

		const currentCase = await dbClient.case.findUnique({
			where: { reference: PLAN_REFERENCE },
			select: { id: true }
		});

		if (!currentCase) {
			throw new Error(`Case ${PLAN_REFERENCE} must exist before seeding examination submission`);
		}

		const submissionDate = new Date();
		const EXAMINING_INSPECTOR_1_ANSWER = 'inspector-1';

		await dbClient.examinationInfo.upsert({
			where: { caseId: currentCase.id },
			create: {
				caseId: currentCase.id,
				status: EXAMINATION_STATUS_ID.IN_EXAMINATION,
				submissionForExaminationDate: submissionDate,
				examiningInspector1: EXAMINING_INSPECTOR_1_ANSWER,
				examiningInspectorAppointmentDate: submissionDate
			},
			update: {
				status: EXAMINATION_STATUS_ID.IN_EXAMINATION,
				submissionForExaminationDate: submissionDate,
				examiningInspector1: EXAMINING_INSPECTOR_1_ANSWER,
				examiningInspectorAppointmentDate: submissionDate
			}
		});

		return { reference: PLAN_REFERENCE, submissionDate };
	} finally {
		await dbClient.$disconnect();
	}
}

if (import.meta.main) {
	seedExaminationInExamination();
}
