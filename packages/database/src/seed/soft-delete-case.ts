import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { loadSeedEnv } from './load-env.ts';

loadSeedEnv();

const reference = process.env.SOFT_DELETE_CASE_REFERENCE;

if (!reference || !/^PLAN-\d+$/.test(reference)) {
	throw new Error('SOFT_DELETE_CASE_REFERENCE must be set to a case reference like PLAN-123456');
}

async function run() {
	const config = loadConfig();
	const dbClient = newDatabaseClient(config.db);

	try {
		const result = await dbClient.case.updateMany({
			where: { reference },
			data: { deletedDate: new Date() }
		});

		if (result.count === 0) {
			throw new Error(`No case found to soft delete for reference "${reference}"`);
		}

		console.log(JSON.stringify({ reference, count: result.count }));
	} catch (error) {
		console.error(error);
		throw error;
	} finally {
		await dbClient.$disconnect();
	}
}

run();
