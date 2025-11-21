import type { CreateResult, UpdateResult, DeleteResult } from '../types/common.ts';

/**
 * Database-agnostic adapter interface
 * SOLID: Interface Segregation - only essential operations
 * YAGNI: Only methods we actually need
 */
export interface DatabaseAdapter<T = Record<string, unknown>> {
	create(data: T): Promise<CreateResult>;
	count(where?: Record<string, unknown>): Promise<number>;
	findById?(id: string): Promise<T | null>;
	update?(id: string, data: Partial<T>): Promise<UpdateResult>;
	delete?(id: string): Promise<DeleteResult>;
}
