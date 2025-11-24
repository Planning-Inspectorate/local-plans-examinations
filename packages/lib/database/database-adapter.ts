import type { CreateResult, UpdateResult, DeleteResult } from './common.ts';

/**
 * Database-agnostic adapter interface for CRUD operations
 *
 * Provides a consistent interface for database operations across different
 * database implementations. Follows SOLID principles with Interface Segregation
 * and includes only essential operations following YAGNI principles.
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
	 * Finds multiple records matching the given criteria
	 *
	 * @param {Record<string, unknown>} [where] - Optional filter criteria
	 * @returns {Promise<T[]>} Promise resolving to array of matching records
	 */
	findMany?(where?: Record<string, unknown>): Promise<T[]>;

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

	/**
	 * Finds the first record matching the given criteria
	 *
	 * @param {Record<string, unknown>} where - Filter criteria
	 * @returns {Promise<T | null>} Promise resolving to the first matching record or null
	 */
	findFirst?(where: Record<string, unknown>): Promise<T | null>;

	/**
	 * Updates multiple records matching the given criteria
	 *
	 * @param {Record<string, unknown>} where - Filter criteria for records to update
	 * @param {Partial<T>} data - The partial data to update records with
	 * @returns {Promise<{ count: number }>} Promise resolving to count of updated records
	 */
	updateMany?(where: Record<string, unknown>, data: Partial<T>): Promise<{ count: number }>;

	/**
	 * Deletes multiple records matching the given criteria
	 *
	 * @param {Record<string, unknown>} where - Filter criteria for records to delete
	 * @returns {Promise<{ count: number }>} Promise resolving to count of deleted records
	 */
	deleteMany?(where: Record<string, unknown>): Promise<{ count: number }>;

	/**
	 * Creates multiple records in a single operation
	 *
	 * @param {T[]} data - Array of data objects to create
	 * @returns {Promise<{ count: number }>} Promise resolving to count of created records
	 */
	createMany?(data: T[]): Promise<{ count: number }>;

	/**
	 * Creates or updates a record based on unique criteria
	 *
	 * @param {Record<string, unknown>} where - Unique criteria to find existing record
	 * @param {T} create - Data to create if record doesn't exist
	 * @param {Partial<T>} update - Data to update if record exists
	 * @returns {Promise<T>} Promise resolving to the created or updated record
	 */
	upsert?(where: Record<string, unknown>, create: T, update: Partial<T>): Promise<T>;

	/**
	 * Checks if a record exists matching the given criteria
	 *
	 * @param {Record<string, unknown>} where - Filter criteria
	 * @returns {Promise<boolean>} Promise resolving to true if record exists
	 */
	exists?(where: Record<string, unknown>): Promise<boolean>;
}
