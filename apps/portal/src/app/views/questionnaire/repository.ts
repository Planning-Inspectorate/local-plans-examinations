/**
 * Repository pattern removed in favor of direct Prisma usage
 *
 * Database adapter abstraction has been removed. Use Prisma client directly
 * in data services for cleaner, type-safe database operations.
 *
 * @example
 * ```typescript
 * // Use Prisma directly instead of repository pattern
 * import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
 *
 * const result = await prisma.questionnaire.create({ data });
 * ```
 */
// Repository pattern removed - use Prisma client directly
