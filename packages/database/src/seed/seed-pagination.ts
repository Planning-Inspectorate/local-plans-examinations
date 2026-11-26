import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { PLAN_TYPE_ID } from './static-data/ids/index.ts';
import { loadSeedEnv } from './load-env.ts';

loadSeedEnv();

const PAGINATION_EMAIL = 'pagination@test.com';

export async function seedPaginationCases() {
	const db = newDatabaseClient(loadConfig().db);
	const caseOfficer = process.env.CYPRESS_AUTH_USER_ID || 'pagination-test-officer';

	try {
		await db.case.deleteMany({ where: { email: PAGINATION_EMAIL } });
		await db.case.createMany({
			data: Array.from({ length: 35 }, (_, i) => ({
				reference: `PLAN-9000${String(i).padStart(2, '0')}`,
				planTitle: `Pagination test ${i + 1}`,
				planType: PLAN_TYPE_ID.LOCAL_PLAN,
				email: PAGINATION_EMAIL,
				caseOfficer
			}))
		});
	} finally {
		await db.$disconnect();
	}
	return null;
}

export async function clearPaginationCases() {
	const db = newDatabaseClient(loadConfig().db);
	try {
		await db.case.deleteMany({ where: { email: PAGINATION_EMAIL } });
	} finally {
		await db.$disconnect();
	}
	return null;
}
