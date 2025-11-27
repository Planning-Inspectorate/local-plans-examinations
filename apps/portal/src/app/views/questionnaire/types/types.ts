/**
 * Re-exports of questionnaire-specific types
 *
 * Provides convenient access to questionnaire types from a single location.
 * Maintains backward compatibility while organizing types in the data layer.
 *
 * @example
 * ```typescript
 * import type { QuestionnaireAnswers, QuestionnaireSubmission } from './types/types.ts';
 * ```
 */
export type { QuestionnaireAnswers, QuestionnaireSubmission } from '../data/types.ts';
