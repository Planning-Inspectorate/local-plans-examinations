import { Journey } from '@planning-inspectorate/dynamic-forms/src/journey/journey.js';
import type { JourneyResponse } from '@planning-inspectorate/dynamic-forms/src/journey/journey-response.js';
import { createSections } from './sections.ts';
import type { Request } from 'express';

/**
 * Unique identifier for the edit questionnaire journey.
 * Uses the same ID as portal's submission journey since it's the same form.
 * Used across the application for session management and routing.
 */
export const EDIT_JOURNEY_ID = 'questionnaire';

/**
 * Validates that the incoming request is for the correct questionnaire journey.
 * Ensures request URL matches the expected questionnaire path.
 *
 * @param req - Express request object
 * @throws When request is not for the questionnaire journey
 */
const validateJourneyRequest = (req: Request): void => {
	if (!req.originalUrl.includes('/questionnaire')) {
		throw new Error("Invalid journey request for 'questionnaire-edit' journey");
	}
};

/**
 * Creates a dynamic forms journey instance for editing questionnaire submissions.
 * Sets up sections, questions, templates, and navigation for the edit flow.
 *
 * @param submissionId - ID of the submission being edited
 * @param journeyResponse - Journey response with answers
 * @param req - Express request object for URL generation
 * @returns Configured journey instance for editing the questionnaire
 * @throws When request validation fails
 */
export const createEditJourney = (submissionId: string, journeyResponse: JourneyResponse, req: Request): Journey => {
	validateJourneyRequest(req);

	const journey = new Journey({
		journeyId: EDIT_JOURNEY_ID,
		sections: createSections(),
		taskListUrl: 'check-your-answers',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/forms-check-your-answers.njk',
		journeyTitle: 'Edit Questionnaire Submission',
		returnToListing: true,

		makeBaseUrl: () => `/questionnaire/${submissionId}/edit`,
		response: journeyResponse,
		baseUrl: `/questionnaire/${submissionId}/edit`
	});

	// Override getBackLink to always return detail page
	(journey as any).getBackLink = () => `/questionnaire/${submissionId}`;

	// Override question methods to add warning and redirect to detail page
	journey.sections.forEach((section: any) => {
		section.questions.forEach((question: any) => {
			const originalPrepQuestion = (question as any).prepQuestionForRendering?.bind(question);
			if (originalPrepQuestion) {
				(question as any).prepQuestionForRendering = function (sec: any, jour: any, customViewData: any, payload: any) {
					const viewModel = originalPrepQuestion(sec, jour, customViewData, payload);
					viewModel.warningText = 'Changes made will update the submission immediately and cannot be undone.';
					return viewModel;
				};
			}
			// Override handleNextQuestion to always redirect to detail page
			(question as any).handleNextQuestion = function (res: any) {
				return res.redirect(`/questionnaire/${submissionId}`);
			};
		});
	});

	return journey;
};
