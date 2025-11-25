import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { Logger } from 'pino';
import type { DatabaseAdapter } from './database-adapter.ts';
import type { CreateResult, UpdateResult, DeleteResult } from './common.ts';

/**
 * Prisma implementation of DatabaseAdapter interface
 *
 * Provides concrete implementation of database operations using Prisma ORM.
 * Handles Prisma operations with clear responsibility separation and is
 * reusable for any Prisma table. Handles audit fields automatically
 * and provides structured logging for all operations.
 *
 * @template T - The data type for records in the database table
 *
 * @example
 * ```typescript
 * const adapter = new PrismaAdapter<User>(prismaClient, 'user', logger);
 * const result = await adapter.create({ name: 'John', email: 'john@example.com' });
 * ```
 */
export class PrismaAdapter<T = Record<string, unknown>> implements DatabaseAdapter<T> {
	/** Prisma client instance for database operations */
	private readonly client: PrismaClient;
	/** Name of the database table this adapter operates on */
	private readonly tableName: string;
	/** Logger instance for operation tracking */
	private readonly logger: Logger;

	/**
	 * Creates a new PrismaAdapter instance
	 *
	 * @param {PrismaClient} client - Prisma client for database operations
	 * @param {string} tableName - Name of the database table to operate on
	 * @param {Logger} logger - Logger for tracking database operations
	 */
	constructor(client: PrismaClient, tableName: string, logger: Logger) {
		this.client = client;
		this.tableName = tableName;
		this.logger = logger;
	}

	/**
	 * Creates a new record in the database
	 *
	 * Inserts a new record with the provided data and returns the creation result.
	 * Automatically handles audit fields and logs the operation.
	 *
	 * @param {T} data - The data to create the record with
	 * @returns {Promise<CreateResult>} Promise resolving to creation result with id and timestamp
	 *
	 * @example
	 * ```typescript
	 * const result = await adapter.create({ name: 'John', email: 'john@example.com' });
	 * console.log(result.id, result.createdAt);
	 * ```
	 */
	async create(data: T): Promise<CreateResult> {
		const table = this.getTable();
		const result = await table.create({
			data,
			select: { id: true, createdAt: true }
		});
		this.logger.info(`Created ${this.tableName} - id: ${result.id}`);
		return result;
	}

	/**
	 * Counts records matching the given criteria
	 *
	 * Returns the total number of records that match the provided filter criteria.
	 * If no criteria provided, returns total count of all records.
	 *
	 * @param {Record<string, unknown>} [where={}] - Optional filter criteria for counting
	 * @returns {Promise<number>} Promise resolving to the count of matching records
	 *
	 * @example
	 * ```typescript
	 * const totalCount = await adapter.count();
	 * const activeCount = await adapter.count({ isDeleted: false });
	 * ```
	 */
	async count(where: Record<string, unknown> = {}): Promise<number> {
		const table = this.getTable();
		const count = await table.count({ where });
		this.logger.debug(`${this.tableName} count: ${count}`);
		return count;
	}

	/**
	 * Finds a record by its unique identifier
	 *
	 * Retrieves a single record matching the provided ID.
	 * Returns null if no record is found.
	 *
	 * @param {string} id - The unique identifier of the record to find
	 * @returns {Promise<T | null>} Promise resolving to the record or null if not found
	 *
	 * @example
	 * ```typescript
	 * const user = await adapter.findById('user123');
	 * if (user) {
	 *   console.log(user.name);
	 * }
	 * ```
	 */
	async findById(id: string): Promise<T | null> {
		const table = this.getTable();
		return table.findUnique({ where: { id } });
	}

	/**
	 * Updates an existing record by its unique identifier
	 *
	 * Updates the record with the provided partial data and automatically
	 * sets the updatedAt timestamp. Returns the update result.
	 *
	 * @param {string} id - The unique identifier of the record to update
	 * @param {Partial<T>} data - The partial data to update the record with
	 * @returns {Promise<UpdateResult>} Promise resolving to update result with id and timestamp
	 *
	 * @example
	 * ```typescript
	 * const result = await adapter.update('user123', { name: 'Jane Doe' });
	 * console.log(result.updatedAt);
	 * ```
	 */
	async update(id: string, data: Partial<T>): Promise<UpdateResult> {
		const table = this.getTable();
		const result = await table.update({
			where: { id },
			data: { ...data, updatedAt: new Date() },
			select: { id: true, updatedAt: true }
		});
		this.logger.info(`Updated ${this.tableName} - id: ${id}`);
		return result;
	}

	/**
	 * Soft deletes a record by its unique identifier
	 *
	 * Marks the record as deleted by setting isDeleted to true and deletedAt timestamp
	 * rather than physically removing it from the database. Returns the deletion result.
	 *
	 * @param {string} id - The unique identifier of the record to delete
	 * @returns {Promise<DeleteResult>} Promise resolving to deletion result with id and timestamp
	 *
	 * @example
	 * ```typescript
	 * const result = await adapter.delete('user123');
	 * console.log(`User deleted at: ${result.deletedAt}`);
	 * ```
	 */
	async delete(id: string): Promise<DeleteResult> {
		const table = this.getTable();
		const result = await table.update({
			where: { id },
			data: { isDeleted: true, deletedAt: new Date() },
			select: { id: true, deletedAt: true }
		});
		this.logger.info(`Deleted ${this.tableName} - id: ${id}`);
		return result;
	}

	/**
	 * Gets the Prisma table accessor for the configured table
	 *
	 * Provides centralized table access logic with consistent interface.
	 * Uses simple accessor pattern for clean database operations.
	 *
	 * @returns {any} Prisma table accessor for database operations
	 * @private
	 */
	private getTable() {
		return (this.client as any)[this.tableName];
	}
}
