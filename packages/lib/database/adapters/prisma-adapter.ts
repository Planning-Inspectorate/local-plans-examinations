import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { Logger } from 'pino';
import type { DatabaseAdapter } from '../interfaces/database-adapter.ts';
import type { CreateResult, UpdateResult, DeleteResult } from '../types/common.ts';

/**
 * Prisma implementation of DatabaseAdapter
 * SOLID: Single Responsibility - only handles Prisma operations
 * DRY: Reusable for any Prisma table
 */
export class PrismaAdapter<T = Record<string, unknown>> implements DatabaseAdapter<T> {
	private readonly client: PrismaClient;
	private readonly tableName: string;
	private readonly logger: Logger;

	constructor(client: PrismaClient, tableName: string, logger: Logger) {
		this.client = client;
		this.tableName = tableName;
		this.logger = logger;
	}

	async create(data: T): Promise<CreateResult> {
		const table = this.getTable();
		const result = await table.create({
			data,
			select: { id: true, createdAt: true }
		});
		this.logger.info(`Created ${this.tableName} - id: ${result.id}`);
		return result;
	}

	async count(where: Record<string, unknown> = {}): Promise<number> {
		const table = this.getTable();
		const count = await table.count({ where });
		this.logger.debug(`${this.tableName} count: ${count}`);
		return count;
	}

	async findById(id: string): Promise<T | null> {
		const table = this.getTable();
		return table.findUnique({ where: { id } });
	}

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
	 * KISS: Simple table accessor
	 * DRY: Centralized table access logic
	 */
	private getTable() {
		return (this.client as any)[this.tableName];
	}
}
