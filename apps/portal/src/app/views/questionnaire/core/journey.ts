import { Journey } from '@planning-inspectorate/dynamic-forms/src/journey/journey.js';
import { createQuestionnaireSections } from './sections.ts';
import { QUESTIONNAIRE_CONFIG } from './config.ts';
import type { Request } from 'express';

/**
 * Re-exported utilities for conditional questioning in templates and sections
 *
 * These utilities are used to implement conditional logic in questionnaire flows,
 * allowing questions to appear or disappear based on previous answers.
 */
export { questionHasAnswer } from '@planning-inspectorate/dynamic-forms/src/components/utils/question-has-answer.js';
export { BOOLEAN_OPTIONS } from '@planning-inspectorate/dynamic-forms/src/components/boolean/question.js';

/**
 * Validates that the request is for the correct questionnaire journey
 *
 * @param {Request} req - Express request object
 * @throws {Error} If request URL doesn't match expected questionnaire path
 * @private
 */
const validateJourneyRequest = (req: Request): void => {
	if (!req.baseUrl.endsWith(`/${QUESTIONNAIRE_CONFIG.id}`)) {
		throw new Error(`Invalid journey request for ${QUESTIONNAIRE_CONFIG.id}`);
	}
};

/**
 * Creates a dynamic forms journey for the questionnaire
 *
 * Configures the complete questionnaire flow including sections, questions,
 * templates, and navigation settings for the dynamic forms library.
 *
 * @param {Record<string, any>} questions - Question definitions from createQuestionnaireQuestions
 * @param {any} response - Current user responses from session
 * @param {Request} req - Express request object for URL building
 * @returns {Journey} Configured dynamic forms journey instance
 *
 * @example
 * ```typescript
 * const questions = createQuestionnaireQuestions();
 * const journey = createQuestionnaireJourney(questions, response, req);
 * ```
 */
export const createQuestionnaireJourney = (questions: Record<string, any>, response: any, req: Request) => {
	validateJourneyRequest(req);

	return new Journey({
		journeyId: QUESTIONNAIRE_CONFIG.id,
		sections: createQuestionnaireSections(questions),
		taskListUrl: QUESTIONNAIRE_CONFIG.routes.checkAnswers,
		journeyTemplate: QUESTIONNAIRE_CONFIG.templates.question,
		taskListTemplate: QUESTIONNAIRE_CONFIG.templates.checkAnswers,
		journeyTitle: 'Local Plans Questionnaire',
		returnToListing: false,
		makeBaseUrl: () => req.baseUrl,
		initialBackLink: '/questionnaire',
		response
	});
};
