import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { seedStaticData } from './data-static.ts';
import { loadSeedEnv } from './load-env.ts';

loadSeedEnv();

const assignedReference = process.env.CYPRESS_ASSIGNED_TO_ME_CASE_REFERENCE || 'PLAN-999998';
const unassignedReference = process.env.CYPRESS_ASSIGNED_TO_ME_UNASSIGNED_CASE_REFERENCE || 'PLAN-999997';
const assignedPlanTitle = process.env.CYPRESS_ASSIGNED_TO_ME_PLAN_TITLE || 'Assigned to me Cypress smoke';
const unassignedPlanTitle = process.env.CYPRESS_ASSIGNED_TO_ME_UNASSIGNED_PLAN_TITLE || 'Unassigned Cypress smoke';
const authEmail = process.env.CYPRESS_AUTH_USERNAME || process.env.E2E_AUTH_USERNAME || 'cypress@test.com';

const authUserId = getRequiredAuthUserId();

async function run() {
	const config = loadConfig();
	assertSafeTargetDatabase(config.db);
	const dbClient = newDatabaseClient(config.db);

	try {
		await seedStaticData(dbClient);

		await dbClient.case.upsert({
			where: { reference: assignedReference },
			update: {
				caseOfficer: authUserId,
				deletedDate: null,
				email: authEmail,
				planTitle: assignedPlanTitle,
				planType: 'local-plan'
			},
			create: {
				caseOfficer: authUserId,
				email: authEmail,
				planTitle: assignedPlanTitle,
				planType: 'local-plan',
				reference: assignedReference,
				caseHistories: {
					create: {
						event: `Case created for plan ${assignedPlanTitle}`,
						username: authEmail
					}
				}
			}
		});

		await dbClient.case.upsert({
			where: { reference: unassignedReference },
			update: {
				caseOfficer: 'unassigned-cypress-user',
				deletedDate: null,
				email: 'unassigned-cypress@test.com',
				planTitle: unassignedPlanTitle,
				planType: 'local-plan'
			},
			create: {
				caseOfficer: 'unassigned-cypress-user',
				email: 'unassigned-cypress@test.com',
				planTitle: unassignedPlanTitle,
				planType: 'local-plan',
				reference: unassignedReference
			}
		});

		console.log(
			JSON.stringify({
				assignedCase: {
					planTitle: assignedPlanTitle,
					reference: assignedReference
				},
				unassignedCase: {
					planTitle: unassignedPlanTitle,
					reference: unassignedReference
				}
			})
		);
	} catch (error) {
		console.error(error);
		throw error;
	} finally {
		await dbClient.$disconnect();
	}
}

run();

function getRequiredAuthUserId() {
	const userId = process.env.CYPRESS_AUTH_USER_ID || process.env.E2E_AUTH_USER_ID;

	if (!userId) {
		throw new Error('CYPRESS_AUTH_USER_ID or E2E_AUTH_USER_ID is required to seed Assigned to me data');
	}

	return userId;
}

function assertSafeTargetDatabase(connectionString: string) {
	const manageBaseUrl = process.env.MANAGE_BASE_URL || '';
	const targetsDeployedManage = manageBaseUrl && !isLocalUrl(manageBaseUrl);

	if (targetsDeployedManage && isLocalDatabaseConnectionString(connectionString)) {
		throw new Error(
			'Assigned to me smoke is targeting deployed Manage, but SQL_CONNECTION_STRING points at a local database. Export the Test SQL connection string before running cy:manage:test-smoke.'
		);
	}
}

function isLocalUrl(url: string) {
	return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?\/?/.test(url);
}

function isLocalDatabaseConnectionString(connectionString: string) {
	return /(?:localhost|127\.0\.0\.1|host\.docker\.internal)/i.test(connectionString);
}
