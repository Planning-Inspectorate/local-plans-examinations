import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';

export async function seedUpdateGateway2Workshop({
	reference,
	workshopData
}: {
	reference: string;
	workshopData: any;
}) {
	const config = loadConfig();
	const dbClient = newDatabaseClient(config.db);

	try {
		const updateCase = await dbClient.case.update({
			where: { reference },
			data: {
				gateway2Info: {
					update: {
						workshops: {
							deleteMany: {},
							create: {
								createdDate: new Date(),
								...workshopData
							}
						}
					}
				}
			}
		});
		return updateCase;
	} catch (error) {
		console.error('Error updating Gateway 2 workshop data:', error);
		throw error;
	} finally {
		await dbClient.$disconnect();
	}
}
