import { newDatabaseClient } from '@pins/local-plans-database';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { Config } from './config.ts';

/**
 * This class encapsulates all the services and clients for the application
 */
export class FunctionService {
	dbClient: PrismaClient;

	constructor(config: Config) {
		if (!config.database.connectionString) {
			throw new Error('database connectionString is required');
		}
		this.dbClient = newDatabaseClient(config.database.connectionString);
	}
}
