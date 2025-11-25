/**
 * Questionnaire service exports for manage app
 *
 * Re-exports questionnaire services with appropriate naming for manage app usage.
 * Provides clean interface for importing questionnaire functionality.
 */
export { QuestionnaireService } from './core/service.ts';
export { QuestionnaireService as QuestionnaireDataService } from './data/service.ts';
