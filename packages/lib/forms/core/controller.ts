import type { Logger } from 'pino';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { clearDataFromSession } from '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js';
import { sessionStore, sessionGet, sessionClear, sessionSetError } from './session.ts';
import type { FormAnswers, FormBusinessService } from './types.ts';

/**
 * Route configuration for the controller interface
 */
export interface RouteConfig {
	baseRoute: string; // e.g., '/feedback'
	checkAnswersRoute: string; // e.g., '/feedback/check-your-answers'
	startRoute: string; // e.g., '/feedback'
	successRoute: string; // e.g., '/feedback/success'
	listRoute: string; // e.g., '/feedback'
	itemsRoute?: string; // e.g., '/items'
}

/**
 * Unified controller interface that both portal and manage apps can use
 * Provides common functionality while allowing customization
 */
export class FormControllerInterface {
	private businessService: FormBusinessService;
	private logger: Logger;
	private routes: RouteConfig;
	private journeyId: string;

	constructor(businessService: FormBusinessService, logger: Logger, routes: RouteConfig, journeyId: string = 'form') {
		this.businessService = businessService;
		this.logger = logger;
		this.routes = routes;
		this.journeyId = journeyId;
	}

	/**
	 * Generic start page controller
	 */
	createStartController(templatePath: string, pageTitle: string): AsyncRequestHandler {
		return async (req, res) => {
			this.logger.info('Displaying form start page');
			res.render(templatePath, { pageTitle });
		};
	}

	/**
	 * Generic success page controller with session validation
	 */
	createSuccessController(templatePath: string, pageTitle: string): AsyncRequestHandler {
		return async (req, res) => {
			const session = sessionGet(req);
			this.logger.info(`Success page request - reference: ${session.reference}, submitted: ${session.submitted}`);

			if (session.error) {
				this.logger.warn(`Session error: ${session.error}, redirecting to check answers`);
				sessionClear(req);
				return res.redirect(this.routes.checkAnswersRoute);
			}

			if (!session.submitted || !session.reference) {
				this.logger.warn('No submission data found, redirecting to start');
				return res.redirect(this.routes.startRoute);
			}

			this.logger.info(`Rendering success page with reference: ${session.reference}`);
			sessionClear(req);
			res.render(templatePath, {
				pageTitle,
				reference: session.reference
			});
		};
	}

	/**
	 * Generic save controller for form submissions
	 */
	createSaveController(): AsyncRequestHandler {
		return async (req, res) => {
			try {
				const answers = res.locals.journeyResponse?.answers as FormAnswers | undefined;
				const journey = res.locals.journey;

				if (!journey?.isComplete()) {
					this.logger.warn('Journey not complete, redirecting to check answers');
					return res.redirect(this.routes.checkAnswersRoute);
				}

				if (!answers || Object.keys(answers).length === 0) {
					this.logger.warn('No answers found, redirecting to start');
					return res.redirect(this.routes.startRoute);
				}

				this.logger.info('Processing form submission');
				const submission = await this.businessService.saveSubmission(answers);
				await this.businessService.sendNotification(submission);

				sessionStore(req, submission);
				clearDataFromSession({ req, journeyId: this.journeyId });

				this.logger.info('Form saved successfully');
				res.redirect(this.routes.successRoute);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				this.logger.error(`Submission error: ${message}`);
				sessionSetError(req, 'There was a problem submitting your form. Please try again.');
				res.redirect(this.routes.checkAnswersRoute);
			}
		};
	}

	/**
	 * Generic list controller for manage functionality
	 */
	createListController(templatePath: string, pageHeading: string): AsyncRequestHandler {
		return async (req, res) => {
			this.logger.info('Displaying form submissions list');

			const [totalCount, submissions] = await Promise.all([
				this.businessService.getTotalSubmissions(),
				this.businessService.getAllSubmissions()
			]);

			const successMessage = req.session.successMessage;
			const errorMessage = req.session.errorMessage;
			delete req.session.successMessage;
			delete req.session.errorMessage;

			const viewModel = {
				pageHeading,
				totalCount,
				submissions,
				successMessage,
				errorMessage,
				formConfig: {
					formRoute: this.routes.baseRoute,
					itemsRoute: this.routes.itemsRoute || '/items',
					emailNotProvided: 'Not Provided'
				}
			};

			this.logger.info(`Rendering form list with ${totalCount} submissions`);
			res.render(templatePath, viewModel);
		};
	}

	/**
	 * Generic detail controller for manage functionality
	 */
	createDetailController(templatePath: string, pageHeading: string): AsyncRequestHandler {
		return async (req, res) => {
			const { id } = req.params;
			this.logger.info(`Displaying form submission detail: ${id}`);

			const submission = await this.businessService.getSubmissionById(id);

			if (!submission) {
				this.logger.warn(`Form submission not found: ${id}`);
				return res.status(404).render('views/errors/404.njk', {
					pageTitle: 'Submission not found',
					message: 'The form submission you are looking for does not exist.'
				});
			}

			const successMessage = req.session.successMessage;
			const errorMessage = req.session.errorMessage;
			delete req.session.successMessage;
			delete req.session.errorMessage;

			const viewModel = {
				pageHeading,
				submission,
				successMessage,
				errorMessage,
				formConfig: {
					backLinkText: 'Back to form list',
					backLinkHref: this.routes.listRoute,
					emailNotProvided: 'Not Provided'
				}
			};

			this.logger.info(`Rendering form detail for submission: ${submission.id}`);
			res.render(templatePath, viewModel);
		};
	}

	/**
	 * Generic delete confirmation controller
	 */
	createDeleteConfirmController(templatePath: string, pageHeading: string): AsyncRequestHandler {
		return async (req, res) => {
			const { id } = req.params;
			this.logger.info(`Displaying delete confirmation for submission: ${id}`);

			const submission = await this.businessService.getSubmissionById(id);

			if (!submission) {
				this.logger.warn(`Submission not found for deletion: ${id}`);
				return res.status(404).render('views/errors/404.njk', {
					pageTitle: 'Not Found',
					message: 'Form submission not found'
				});
			}

			res.render(templatePath, {
				pageHeading,
				submission
			});
		};
	}

	/**
	 * Generic delete controller
	 */
	createDeleteController(): AsyncRequestHandler {
		return async (req, res) => {
			const { id } = req.params;
			this.logger.info(`Deleting form submission: ${id}`);

			try {
				await this.businessService.deleteSubmission(id);

				this.logger.info(`Successfully deleted form submission: ${id}`);
				req.session.successMessage = 'Form submission deleted successfully';
				res.redirect(this.routes.listRoute);
			} catch (error) {
				this.logger.error(`Failed to delete submission ${id}: ${String(error)}`);
				req.session.errorMessage = 'Failed to delete submission';
				res.redirect(`${this.routes.baseRoute}/${id}`);
			}
		};
	}
}
