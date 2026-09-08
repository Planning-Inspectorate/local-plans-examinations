import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';

export async function seedDev(dbClient: PrismaClient) {
	await dbClient.case.create({
		data: {
			reference: 'PLAN-003',
			email: 'lpa-user@example.com',
			caseOfficer: 'officer-1',
			planTitle: 'Southside Local Plan',
			planType: 'local-plan',
			gateway2Date: new Date('2026-07-21T12:00:00.000Z'),
			gateway2Info: {
				create: {
					workshopVenue: 'Virtual',
					workshopDate: new Date('2026-05-19T09:00:00.000Z')
				}
			}
		}
	});

	console.log('dev seed complete');
}
