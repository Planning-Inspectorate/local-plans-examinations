/**
 * Database utilities - clean, focused exports
 * KISS: Simple barrel exports
 */
export { DatabaseService } from './services/database-service.ts';
export { PrismaAdapter } from './adapters/prisma-adapter.ts';
export type { DatabaseAdapter } from './interfaces/database-adapter.ts';
export type { CreateResult, UpdateResult, DeleteResult } from './types/common.ts';
