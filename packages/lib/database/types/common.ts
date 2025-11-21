/**
 * Common database operation result types
 * KISS: Simple, focused types
 */
export interface CreateResult {
	id: string;
	createdAt: Date;
}

export interface UpdateResult {
	id: string;
	updatedAt: Date;
}

export interface DeleteResult {
	id: string;
	deletedAt: Date;
}
