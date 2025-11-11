import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';

export async function seedDev(dbClient: PrismaClient) {
	// TODO: add seed data
	await dbClient.$queryRaw`SELECT 1`;

	console.log('dev seed complete');
}
