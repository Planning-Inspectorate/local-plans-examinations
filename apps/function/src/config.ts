import { loadEnvFile } from 'node:process';
import type { DatabaseConfig } from '@pins/local-plans-lib/app/config-types.d.ts';

export interface Config {
	example: {
		enabled: boolean;
		schedule: string;
	};
	database: DatabaseConfig;
}

export function loadConfig(): Config {
	// load configuration from .env file into process.env
	// prettier-ignore
	try { loadEnvFile(); } catch {/* ignore errors*/}

	// get values from the environment
	const { EXAMPLE_FUNCTION_ENABLED, EXAMPLE_SCHEDULE, SQL_CONNECTION_STRING } = process.env;

	if (!SQL_CONNECTION_STRING) {
		throw new Error('SQL_CONNECTION_STRING is required');
	}

	return {
		example: {
			enabled: EXAMPLE_FUNCTION_ENABLED === 'true',
			schedule: EXAMPLE_SCHEDULE || '0 0 0 * * *' // default to daily at midnight
		},
		database: {
			connectionString: SQL_CONNECTION_STRING
		}
	};
}
