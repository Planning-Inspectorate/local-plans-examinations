import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { newDatabaseClient } from '../../packages/database/src/index.ts';
import { seedCy } from '../../packages/database/src/seed/seed-cy.ts';
import { PLAN_TYPE_ID } from '../../packages/database/src/seed/static-data/ids/index.ts';
import { settings, type Settings } from './settings.ts';

export function ownedCases(runId: string) {
	if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(runId)) {
		throw new Error('PERFORMANCE_RUN_ID must be a UUID');
	}
	return { deleteReason: `local-plans-performance:${runId}`, email: 'performance@example.gov.uk' };
}

export async function seedPerformanceCases(config: Settings, runId: string) {
	const where = ownedCases(runId);
	const db = newDatabaseClient(config.database);
	const references: string[] = [];
	try {
		const lpa = await db.lPA.findFirstOrThrow({ orderBy: { lpaCode: 'asc' } });
		for (let index = 0; index < config.manageUsers; index++) {
			const { reference } = await seedCy({
				seedReferenceData: false,
				caseData: {
					...where,
					id: randomUUID(),
					reference: `PLAN-${Date.now()}${index}`,
					caseOfficer: config.userId,
					caseOfficerName: 'Performance service account',
					planTitle: `Performance case ${index + 1}`,
					planTypeLookup: { connect: { id: PLAN_TYPE_ID.LOCAL_PLAN } },
					lpas: { connect: { lpaCode: lpa.lpaCode } },
					gateway1Info: { create: {} },
					gateway2Info: { create: {} },
					gateway3Info: { create: { submissions: { create: {} } } },
					examinationInfo: { create: {} }
				}
			});
			references.push(reference);
			await writeFile(join(config.privateDir, `manage-${index + 1}.csv`), `${reference}\n`, { mode: 0o600 });
		}
		await writeFile(join(config.privateDir, 'references.json'), JSON.stringify(references), { mode: 0o600 });
		await writeFile(join(config.resultsDir, 'cases.json'), JSON.stringify({ runId, references }, null, 2));
	} finally {
		await db.$disconnect();
	}
}

export async function cleanupPerformanceCases(config: Settings, runId: string) {
	const where = ownedCases(runId);
	const db = newDatabaseClient(config.database);
	try {
		// Only this workload's records; unexpected dependants make the transaction fail safely.
		await db.$transaction([
			db.caseHistory.deleteMany({ where: { case: where } }),
			db.gateway1Info.deleteMany({ where: { case: where } }),
			db.gateway2Info.deleteMany({ where: { case: where } }),
			db.gateway3Submission.deleteMany({ where: { gateway3Info: { case: where } } }),
			db.gateway3Info.deleteMany({ where: { case: where } }),
			db.examinationInfo.deleteMany({ where: { case: where } }),
			db.case.deleteMany({ where })
		]);
	} finally {
		await db.$disconnect();
	}
}

if (import.meta.main) {
	const config = settings();
	const runId = process.env.PERFORMANCE_RUN_ID || '';
	if (process.argv[2] === 'seed') await seedPerformanceCases(config, runId);
	else if (process.argv[2] === 'cleanup') await cleanupPerformanceCases(config, runId);
	else throw new Error('Expected seed or cleanup');
}
