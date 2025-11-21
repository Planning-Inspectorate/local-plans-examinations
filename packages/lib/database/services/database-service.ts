import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { Logger } from 'pino';
import type { DatabaseAdapter } from '../interfaces/database-adapter.ts';
import { PrismaAdapter } from '../adapters/prisma-adapter.ts';

/**
 * Database service factory
 * SOLID: Single Responsibility - creates database adapters
 * SOLID: Dependency Inversion - depends on abstractions, not concretions
 * KISS: Simple factory pattern
 */
export class DatabaseService {
	private readonly client: PrismaClient;
	private readonly logger: Logger;

	constructor(client: PrismaClient, logger: Logger) {
		this.client = client;
		this.logger = logger;
	}

	/**
	 * Create a database adapter for any table
	 * YAGNI: Only create what's needed, when needed
	 * DRY: Reusable factory method
	 */
	createAdapter<T = Record<string, unknown>>(tableName: string): DatabaseAdapter<T> {
		return new PrismaAdapter<T>(this.client, tableName, this.logger);
	}
}
