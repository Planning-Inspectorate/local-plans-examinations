import { Journey } from '@planning-inspectorate/dynamic-forms/src/journey/journey.js';
import { createSections } from './sections.ts';
import type { Request } from 'express';
import type { QuestionnaireQuestions } from './service.ts';

// Re-export utilities for conditional questioning logic
export { questionHasAnswer } from '@planning-inspectorate/dynamic-forms/src/components/utils/question-has-answer.js';
export { BOOLEAN_OPTIONS } from '@planning-inspectorate/dynamic-forms/src/components/boolean/question.js';

/**
 * Unique identifier for the questionnaire journey.
 * Used across the application for session management and routing.
 */
export const JOURNEY_ID = 'questionnaire';

/**
 * Validates that the incoming request is for the correct questionnaire journey.
 * Ensures request URL matches the expected questionnaire path.
 *
 * @param req - Express request object
 * @throws When request is not for the questionnaire journey
 */
const validateJourneyRequest = (req: Request): void => {
	if (!req.baseUrl.endsWith('/questionnaire')) {
		throw new Error("Invalid journey request for 'questionnaire' journey");
	}
};

/**
 * Creates a dynamic forms journey instance with all necessary configuration.
 * Sets up sections, questions, templates, and navigation for the questionnaire.
 *
 * @param questions - Question definitions for the journey
 * @param response - Journey response data from session
 * @param req - Express request object for URL generation
 * @returns Configured journey instance for the questionnaire
 * @throws When request validation fails
 */
export const createJourney = (questions: QuestionnaireQuestions, response: unknown, req: Request) => {
	validateJourneyRequest(req);

	return new Journey({
		journeyId: JOURNEY_ID,
		sections: createSections(questions),
		taskListUrl: 'check-your-answers',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/forms-check-your-answers.njk',
		journeyTitle: 'Local Plans Questionnaire',
		returnToListing: false,
		makeBaseUrl: () => req.baseUrl,
		initialBackLink: '/questionnaire',
		response
	});
};
