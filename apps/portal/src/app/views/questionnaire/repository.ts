/**
 * Legacy repository export for backward compatibility
 *
 * Re-exports the PrismaAdapter as PrismaQuestionnaireRepository to maintain
 * compatibility with existing code that expects repository pattern naming.
 * New code should use DatabaseService and adapters directly.
 *
 * @deprecated Use DatabaseService.createAdapter() instead for new implementations
 *
 * @example
 * ```typescript
 * // Legacy usage (deprecated)
 * import { PrismaQuestionnaireRepository } from './repository.ts';
 *
 * // Preferred usage
 * import { DatabaseService } from '@pins/local-plans-lib/database';
 * const adapter = databaseService.createAdapter('questionnaire');
 * ```
 */
export { PrismaAdapter as PrismaQuestionnaireRepository } from '@pins/local-plans-lib/database';
