import type { Logger } from 'pino';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { FormControllerInterface } from '../../core/controller.ts';
import type { FormBusinessService } from '../../core/types.ts';

/**
 * Feedback-specific controller messages and configuration
 */
export class FeedbackControllerInterface extends FormControllerInterface {
	constructor(businessService: FormBusinessService, logger: Logger) {
		const routes = {
			baseRoute: '/feedback',
			checkAnswersRoute: '/feedback/check-your-answers',
			startRoute: '/feedback',
			successRoute: '/feedback/success',
			listRoute: '/feedback',
			itemsRoute: '/items'
		};
		super(businessService, logger, routes, 'feedback');
	}

	/**
	 * Feedback-specific success controller with custom messaging
	 */
	createSuccessController(templatePath: string): AsyncRequestHandler {
		return super.createSuccessController(templatePath, 'Feedback submitted successfully');
	}

	/**
	 * Feedback-specific start controller with custom messaging
	 */
	createStartController(templatePath: string): AsyncRequestHandler {
		return super.createStartController(templatePath, 'Local Plans Feedback Form');
	}

	/**
	 * Feedback-specific list controller with custom configuration
	 */
	createListController(templatePath: string): AsyncRequestHandler {
		return super.createListController(templatePath, 'Feedback Submissions');
	}

	/**
	 * Feedback-specific detail controller with custom configuration
	 */
	createDetailController(templatePath: string): AsyncRequestHandler {
		return super.createDetailController(templatePath, 'Feedback Submission');
	}

	/**
	 * Feedback-specific delete confirmation controller
	 */
	createDeleteConfirmController(templatePath: string): AsyncRequestHandler {
		return super.createDeleteConfirmController(templatePath, 'Delete Feedback Submission');
	}
}
