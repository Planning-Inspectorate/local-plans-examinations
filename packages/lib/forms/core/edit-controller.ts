import { Journey } from '@planning-inspectorate/dynamic-forms/src/journey/journey.js';
import { question } from '@planning-inspectorate/dynamic-forms/src/controller.js';
import type {
	FormDataService,
	FormRequest,
	FormResponse,
	ControllerHandler,
	EditConfig,
	FormQuestions
} from './types.ts';
import type { Logger } from 'pino';

/**
 * Generic edit controller - works with any form type through configuration
 */
export class EditController<T = Record<string, any>> {
	private dataService: FormDataService;
	private logger: Logger;
	private questions: FormQuestions;
	private editConfig: EditConfig<T>;
	private createSections: (questions: FormQuestions) => any;

	constructor(
		dataService: FormDataService,
		logger: Logger,
		questions: FormQuestions,
		editConfig: EditConfig<T>,
		createSection: (questions: FormQuestions) => any
	) {
		this.dataService = dataService;
		this.logger = logger;
		this.questions = questions;
		this.editConfig = editConfig;
		this.createSections = createSection;
	}

	createGetHandler(submissionIdParam: string = 'id'): ControllerHandler {
		return async (req: FormRequest, res: FormResponse): Promise<void> => {
			try {
				this.logger.info(
					`Edit GET request - URL: ${req.url}, params: ${JSON.stringify(req.params)}, baseRoute: ${this.editConfig.routeConfig.baseRoute}`
				);
				const submissionId = req.params[submissionIdParam];

				if (!submissionId || typeof submissionId !== 'string') {
					this.logger.warn(`Invalid submission ID format: ${submissionId}`);
					return res.status(400).render('views/errors/404.njk', {
						pageTitle: 'Bad Request',
						message: 'Invalid submission ID'
					});
				}

				const submission = await this.dataService.getSubmissionById(submissionId);

				if (!submission) {
					this.logger.warn(`Submission not found for edit: ${submissionId}`);
					return res.status(404).render('views/errors/404.njk', {
						pageTitle: 'Not Found',
						message: this.editConfig.messages.notFound
					});
				}

				const answers = this.editConfig.submissionMapper(submission);
				const journeyResponse = { answers };

				const journey = new Journey({
					journeyId: `${this.editConfig.routeConfig.baseRoute.slice(1)}-edit`,
					sections: this.createSections(this.questions),
					taskListUrl: 'check-your-answers',
					journeyTemplate: 'views/layouts/forms-question.njk',
					taskListTemplate: 'views/layouts/forms-check-your-answers.njk',
					journeyTitle: `Edit ${this.editConfig.routeConfig.baseRoute.slice(1)}`,
					returnToListing: false,
					makeBaseUrl: () => `${this.editConfig.routeConfig.baseRoute}/${submissionId}/edit`,
					baseUrl: `${this.editConfig.routeConfig.baseRoute}/${submissionId}/edit`,
					initialBackLink: `${this.editConfig.routeConfig.baseRoute}/${submissionId}`,
					response: journeyResponse
				});

				// Override getBackLink to always return detail page URL
				journey.getBackLink = () => {
					return `${this.editConfig.routeConfig.baseRoute}/${submissionId}`;
				};

				res.locals.journey = journey;
				res.locals.journeyResponse = journeyResponse;

				question(req as any, res);
				return;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				this.logger.error(`Error loading edit form for submission ${req.params[submissionIdParam]}: ${errorMessage}`);

				return res.status(500).render('views/errors/404.njk', {
					pageTitle: 'Server Error',
					message: 'Unable to load the edit form. Please try again later.'
				});
			}
		};
	}

	createPostHandler(submissionIdParam: string = 'id'): ControllerHandler {
		return async (req: FormRequest, res: FormResponse) => {
			const submissionId = req.params[submissionIdParam];
			const { question: questionKey } = req.params;

			try {
				if (!submissionId || typeof submissionId !== 'string') {
					this.logger.warn(`Invalid submission ID for edit: ${submissionId}`);
					req.session.errorMessage = 'Invalid submission ID';
					return res.redirect(this.editConfig.routeConfig.baseRoute);
				}

				if (!questionKey || typeof questionKey !== 'string') {
					this.logger.warn(`Invalid question key for edit: ${questionKey}`);
					req.session.errorMessage = 'Invalid form field';
					return res.redirect(`${this.editConfig.routeConfig.baseRoute}/${submissionId}`);
				}

				if (!this.editConfig.allowedFields[questionKey]) {
					this.logger.warn(`Unauthorized edit attempt for field: ${questionKey}`);
					req.session.errorMessage = 'Invalid form field';
					return res.redirect(`${this.editConfig.routeConfig.baseRoute}/${submissionId}`);
				}

				const submission = await this.dataService.getSubmissionById(submissionId);
				if (!submission) {
					this.logger.warn(`Submission not found for update: ${submissionId}`);
					req.session.errorMessage = this.editConfig.messages.notFound;
					return res.redirect(this.editConfig.routeConfig.baseRoute);
				}

				const fieldConfig = this.editConfig.allowedFields[questionKey];
				const fieldValue = this.editConfig.getFieldValue(req.body, questionKey);

				if (fieldConfig.required && (fieldValue === undefined || fieldValue === null)) {
					this.logger.warn(`Missing field value for ${questionKey} in edit request`);
					req.session.errorMessage = 'Missing required field value';
					return res.redirect(
						`${this.editConfig.routeConfig.baseRoute}/${submissionId}/edit/${req.params.section}/${questionKey}`
					);
				}

				if (fieldConfig.validator) {
					const validationError = fieldConfig.validator(fieldValue);
					if (validationError) {
						req.session.errorMessage = validationError;
						return res.redirect(
							`${this.editConfig.routeConfig.baseRoute}/${submissionId}/edit/${req.params.section}/${questionKey}`
						);
					}
				}

				const currentAnswers = this.editConfig.submissionMapper(submission);
				const updatedAnswers = this.editConfig.mapToAnswers(questionKey, fieldValue, currentAnswers);

				await this.dataService.updateSubmission(submissionId, updatedAnswers as any);

				this.logger.info(`Successfully updated submission ${submissionId} field ${questionKey}`);

				req.session.successMessage = this.editConfig.messages.updated;
				res.redirect(`${this.editConfig.routeConfig.baseRoute}/${submissionId}`);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				this.logger.error(`Failed to update submission ${submissionId}: ${errorMessage}`);

				req.session.errorMessage = this.editConfig.messages.updateFailed;
				res.redirect(`${this.editConfig.routeConfig.baseRoute}/${submissionId}`);
			}
		};
	}
}
