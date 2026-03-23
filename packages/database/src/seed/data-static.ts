import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';

const NOTIFY_STATUS = [
	{ id: 'sending', displayName: 'Sending' },
	{ id: 'delivered', displayName: 'Delivered' },
	{ id: 'permanent-failure', displayName: 'Permanent failure' },
	{ id: 'temporary-failure', displayName: 'Temporary failure' },
	{ id: 'technical-failure', displayName: 'Technical failure' }
];

export async function seedStaticData(dbClient: PrismaClient) {
	for (const status of NOTIFY_STATUS) {
		await dbClient.notifyStatus.upsert({
			where: { id: status.id },
			update: { displayName: status.displayName },
			create: status
		});
	}
	console.log('static data seed complete');
}
