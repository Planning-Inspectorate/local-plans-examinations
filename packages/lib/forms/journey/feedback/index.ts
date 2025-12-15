/**
 * Feedback journey exports - feedback-specific implementations
 */

export { createFeedbackPortalForm, createFeedbackManageForm } from './factory.ts';
export { FeedbackControllerInterface } from './controller.ts';
export { createFeedbackEditConfig } from './edit-config.ts';
export type { FeedbackAnswers } from './edit-config.ts';

// Re-export existing feedback journey components
export { createJourney, JOURNEY_ID } from './journey.ts';
export { createFormQuestions } from './questions.ts';
export { createSections } from './sections.ts';
