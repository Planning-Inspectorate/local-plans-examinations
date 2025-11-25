import type { CreateResult, UpdateResult, DeleteResult } from './common.ts';

/**
 * Database-agnostic adapter interface for CRUD operations
 *
 * Provides a consistent interface for database operations across different
 * database implementations. Uses interface segregation to include only
 * essential operations needed for database access.
 *
 * @template T - The data type for records in the database table
 *
 * @example
 * ```typescript
 * const adapter: DatabaseAdapter<User> = new PrismaAdapter(client, 'user', logger);
 * const result = await adapter.create({ name: 'John', email: 'john@example.com' });
 * ```
 */
export interface DatabaseAdapter<T = Record<string, unknown>> {
	/**
	 * Creates a new record in the database
	 *
	 * @param {T} data - The data to create the record with
	 * @returns {Promise<CreateResult>} Promise resolving to creation result with id and timestamp
	 */
	create(data: T): Promise<CreateResult>;

	/**
	 * Counts records matching the given criteria
	 *
	 * @param {Record<string, unknown>} [where] - Optional filter criteria for counting
	 * @returns {Promise<number>} Promise resolving to the count of matching records
	 */
	count(where?: Record<string, unknown>): Promise<number>;

	/**
	 * Finds a record by its unique identifier
	 *
	 * @param {string} id - The unique identifier of the record to find
	 * @returns {Promise<T | null>} Promise resolving to the record or null if not found
	 */
	findById?(id: string): Promise<T | null>;

	/**
	 * Updates an existing record by its unique identifier
	 *
	 * @param {string} id - The unique identifier of the record to update
	 * @param {Partial<T>} data - The partial data to update the record with
	 * @returns {Promise<UpdateResult>} Promise resolving to update result with id and timestamp
	 */
	update?(id: string, data: Partial<T>): Promise<UpdateResult>;

	/**
	 * Soft deletes a record by its unique identifier
	 *
	 * @param {string} id - The unique identifier of the record to delete
	 * @returns {Promise<DeleteResult>} Promise resolving to deletion result with id and timestamp
	 */
	delete?(id: string): Promise<DeleteResult>;
}
