/**
 * Questionnaire core module exports
 * Provides centralized access to questionnaire configuration, services, and types
 * @module QuestionnaireCore
 */

export { QUESTIONNAIRE_CONFIG, type QuestionnaireAnswers, type TaskListSection } from './config.ts';
export { QuestionnaireService, questionnaireService } from './service.ts';

/** Re-exported types for external module convenience */
export type { PortalService } from '#service';
export type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
export type { Request, Response } from 'express';
