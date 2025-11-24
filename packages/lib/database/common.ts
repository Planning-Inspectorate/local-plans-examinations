/**
 * Result interface for database create operations
 *
 * Contains the unique identifier and timestamp of the newly created record.
 * Used across all database adapters to provide consistent create operation responses.
 */
export interface CreateResult {
	/** Unique identifier of the created record */
	id: string;
	/** Timestamp when the record was created */
	createdAt: Date;
}

/**
 * Result interface for database update operations
 *
 * Contains the unique identifier and timestamp of the updated record.
 * Used across all database adapters to provide consistent update operation responses.
 */
export interface UpdateResult {
	/** Unique identifier of the updated record */
	id: string;
	/** Timestamp when the record was last updated */
	updatedAt: Date;
}

/**
 * Result interface for database delete operations
 *
 * Contains the unique identifier and timestamp of the soft-deleted record.
 * Used across all database adapters to provide consistent delete operation responses.
 * Note: This represents soft deletion where records are marked as deleted rather than physically removed.
 */
export interface DeleteResult {
	/** Unique identifier of the deleted record */
	id: string;
	/** Timestamp when the record was marked as deleted */
	deletedAt: Date;
}
