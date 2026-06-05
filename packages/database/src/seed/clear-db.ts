import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
	const config = loadConfig();

	const dbClient = newDatabaseClient(config.db);
	try {
		await dbClient.case.deleteMany({});
		await dbClient.contact.deleteMany({});
		await dbClient.lPA.deleteMany({});
		console.log('Database cleared');
	} catch (error) {
		console.error(error);
		throw error;
	} finally {
		await dbClient.$disconnect();
	}
}

run();
