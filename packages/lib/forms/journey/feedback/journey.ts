import { Journey } from '@planning-inspectorate/dynamic-forms/src/journey/journey.js';
import { createSections } from './sections.ts';
import type { Request } from 'express';
import type { FormQuestions } from '../../core/service.ts';

/**
 * Unique identifier for the feedback journey.
 * Used across the application for session management and routing.
 */
export const JOURNEY_ID = 'feedback';

/**
 * Creates a dynamic forms journey instance with all necessary configuration.
 * Sets up sections, questions, templates, and navigation for the feedback form.
 *
 * @param questions - Question definitions for the journey
 * @param response - Journey response data from session (answers object, null, or undefined)
 * @param req - Express request object for URL generation
 * @returns Configured journey instance for the feedback form
 */
export const createJourney = (
	questions: FormQuestions,
	response: Record<string, any> | null | undefined,
	req: Request
) => {
	return new Journey({
		journeyId: JOURNEY_ID,
		sections: createSections(questions),
		taskListUrl: 'check-your-answers',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/forms-check-your-answers.njk',
		journeyTitle: 'Local Plans Feedback',
		returnToListing: false,
		makeBaseUrl: () => req.baseUrl,
		baseUrl: req.baseUrl,
		initialBackLink: '/feedback',
		response
	});
};
