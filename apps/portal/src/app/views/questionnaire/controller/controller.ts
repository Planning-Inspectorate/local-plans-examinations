import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { createQuestionnaireService, SessionManager } from '../core/index.ts';
import { createQuestionnaireDataService } from '../data/service.ts';

/**
 * Handles session errors by clearing the session and redirecting to check answers page.
 * Used when the session is corrupted or contains invalid data.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param error - Error message describing the session issue
 * @param logger - Logger instance for recording the error
 * @returns Redirect response to check answers page
 */
const handleSessionError = (req: any, res: any, error: string, logger: PortalService['logger']) => {
	logger.warn(`Session error: ${error}, redirecting to check answers`);
	SessionManager.clear(req);
	return res.redirect('/questionnaire/check-your-answers');
};

/**
 * Handles cases where no valid submission data is found in the session.
 * Redirects user back to the questionnaire start page.
 *
 * @param res - Express response object
 * @param logger - Logger instance for recording the event
 * @returns Redirect response to questionnaire start page
 */
const handleMissingSession = (res: any, logger: PortalService['logger']) => {
	logger.warn('No submission data found, redirecting to start');
	return res.redirect('/questionnaire');
};

/**
 * Renders the success page with the submission reference and clears the session.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param reference - Unique reference ID for the submitted questionnaire
 * @param logger - Logger instance for recording the success
 */
const renderSuccessPage = (req: any, res: any, reference: string, logger: PortalService['logger']) => {
	logger.info(`Rendering success page with reference: ${reference}`);
	SessionManager.clear(req);
	res.render('views/questionnaire/templates/form-success.njk', {
		pageTitle: 'Questionnaire submitted successfully',
		reference
	});
};

/**
 * Creates a handler for the questionnaire start page.
 * Displays the initial questionnaire landing page with start button.
 *
 * @param logger - Logger instance for recording page views
 * @returns Express route handler function
 */
const startJourney =
	(logger: PortalService['logger']): AsyncRequestHandler =>
	async (req, res) => {
		logger.info('Displaying questionnaire start page');
		res.render('views/questionnaire/templates/form-start.njk', {
			pageTitle: 'Local Plans Questionnaire'
		});
	};

/**
 * Creates a handler for the questionnaire success page.
 * Validates session data and displays success page or redirects appropriately.
 *
 * @param logger - Logger instance for recording events
 * @returns Express route handler function
 */
const viewSuccessPage =
	(logger: PortalService['logger']): AsyncRequestHandler =>
	async (req, res) => {
		const session = SessionManager.get(req);
		logger.info(`Success page request - reference: ${session.reference}, submitted: ${session.submitted}`);

		if (session.error) {
			return handleSessionError(req, res, session.error, logger);
		}

		if (!session.submitted || !session.reference) {
			return handleMissingSession(res, logger);
		}

		return renderSuccessPage(req, res, session.reference, logger);
	};

/**
 * Factory function that creates all questionnaire controllers with their dependencies.
 * Sets up the data service, business logic service, and page handlers.
 *
 * @param portalService - The portal service containing database and logger
 * @returns Object containing all questionnaire controllers and services
 */
export const createQuestionnaireControllers = (portalService: PortalService) => {
	const questionnaireDataService = createQuestionnaireDataService(portalService.db, portalService.logger);
	const questionnaireService = createQuestionnaireService(portalService.logger, questionnaireDataService);

	return {
		startJourney: startJourney(portalService.logger),
		viewSuccessPage: viewSuccessPage(portalService.logger),
		questionnaireService
	};
};
