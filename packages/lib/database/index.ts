/**
 * Database utilities package exports
 *
 * Provides clean, focused exports for database operations including
 * service factory, adapter implementations, interfaces, and result types.
 * Designed for enterprise-grade database access patterns with clear separation of concerns.
 *
 * @example
 * ```typescript
 * import { DatabaseService, type DatabaseAdapter } from '@pins/local-plans-lib/database';
 *
 * const databaseService = new DatabaseService(prismaClient, logger);
 * const adapter = databaseService.createAdapter('questionnaire');
 * ```
 */
export { DatabaseService } from './database-service.ts';
export { PrismaAdapter } from './prisma-adapter.ts';
export type { DatabaseAdapter } from './database-adapter.ts';
export type { CreateResult, UpdateResult, DeleteResult } from './common.ts';
