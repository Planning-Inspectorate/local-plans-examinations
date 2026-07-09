import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { loadEnvFile } from 'node:process';
import path from 'path';
// prettier-ignore
try { loadEnvFile(path.resolve(__dirname, '../../.env')); } catch {/* ignore errors*/}

async function run() {
	const config = loadConfig();

	const dbClient = newDatabaseClient(config.db);
	try {
		await dbClient.caseHistory.deleteMany({});
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
