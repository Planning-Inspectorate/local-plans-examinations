import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { Logger } from 'pino';
import type { DatabaseAdapter } from './database-adapter.ts';
import { PrismaAdapter } from './prisma-adapter.ts';

/**
 * Database service factory for creating database adapters
 *
 * Provides a centralized factory for creating database adapters with proper
 * dependency injection. Follows SOLID principles with Single Responsibility
 * for adapter creation and Dependency Inversion by depending on abstractions.
 * Uses simple factory pattern following KISS principles.
 *
 * @example
 * ```typescript
 * const databaseService = new DatabaseService(prismaClient, logger);
 * const userAdapter = databaseService.createAdapter<User>('user');
 * const questionnaireAdapter = databaseService.createAdapter('questionnaire');
 * ```
 */
export class DatabaseService {
	/** Prisma client instance for database operations */
	private readonly client: PrismaClient;
	/** Logger instance for operation tracking */
	private readonly logger: Logger;

	/**
	 * Creates a new DatabaseService instance
	 *
	 * @param {PrismaClient} client - Prisma client for database operations
	 * @param {Logger} logger - Logger for tracking database operations
	 */
	constructor(client: PrismaClient, logger: Logger) {
		this.client = client;
		this.logger = logger;
	}

	/**
	 * Creates a database adapter for the specified table
	 *
	 * Factory method that creates database adapters on demand, following YAGNI
	 * principles by only creating what's needed when needed. Provides DRY
	 * reusable factory method for any database table.
	 *
	 * @template T - The data type for records in the database table
	 * @param {string} tableName - Name of the database table to create adapter for
	 * @returns {DatabaseAdapter<T>} Database adapter instance for the specified table
	 *
	 * @example
	 * ```typescript
	 * const userAdapter = databaseService.createAdapter<User>('user');
	 * const result = await userAdapter.create({ name: 'John', email: 'john@example.com' });
	 * ```
	 */
	createAdapter<T = Record<string, unknown>>(tableName: string): DatabaseAdapter<T> {
		return new PrismaAdapter<T>(this.client, tableName, this.logger);
	}
}
