import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { QuestionnaireListViewModel, QuestionnaireDetailViewModel, QuestionnaireDetailParams } from '../types.ts';
import { createQuestionnaireService } from '../core/service.ts';
import { createQuestionnaireDataService } from '../data/service.ts';

/**
 * Handles rendering of questionnaire list page with error handling.
 *
 * @param res - Express response object
 * @param viewModel - Data for rendering the list page
 * @param logger - Logger instance
 */
const renderListPage = (res: any, viewModel: QuestionnaireListViewModel, logger: any) => {
	logger.info(`Rendering questionnaire list with ${viewModel.totalCount} submissions`);
	res.render('views/questionnaire/templates/view.njk', viewModel);
};

/**
 * Handles rendering of questionnaire detail page.
 *
 * @param res - Express response object
 * @param viewModel - Data for rendering the detail page
 * @param logger - Logger instance
 */
const renderDetailPage = (res: any, viewModel: QuestionnaireDetailViewModel, logger: any) => {
	logger.info(`Rendering questionnaire detail for submission: ${viewModel.submission.id}`);
	res.render('views/questionnaire/templates/detail.njk', viewModel);
};

/**
 * Handles cases where questionnaire submission is not found.
 *
 * @param res - Express response object
 * @param id - Submission ID that was not found
 * @param logger - Logger instance
 */
const handleNotFound = (res: any, id: string, logger: any) => {
	logger.warn(`Questionnaire submission not found: ${id}`);
	res.status(404).render('views/errors/404.njk', {
		pageTitle: 'Submission not found',
		message: 'The questionnaire submission you are looking for does not exist.'
	});
};

/**
 * Creates questionnaire list controller for manage app.
 * Displays paginated list of questionnaire submissions.
 *
 * @param logger - Logger instance for recording operations
 * @param questionnaireService - Business service for questionnaire operations
 * @returns Express route handler function
 */
const createListController =
	(logger: ManageService['logger'], questionnaireService: any): AsyncRequestHandler =>
	async (req, res) => {
		logger.info('Displaying questionnaire submissions list');

		const [totalCount, submissions] = await Promise.all([
			questionnaireService.getTotalSubmissions(),
			questionnaireService.getAllSubmissions()
		]);

		// Get flash messages from session
		const successMessage = req.session.successMessage;
		const errorMessage = req.session.errorMessage;

		// Clear messages after reading
		delete req.session.successMessage;
		delete req.session.errorMessage;

		const viewModel: QuestionnaireListViewModel = {
			pageHeading: 'Questionnaire Submissions',
			totalCount,
			submissions,
			successMessage,
			errorMessage,
			questionnaireConfig: {
				questionnaireRoute: '/questionnaire',
				itemsRoute: '/items',
				emailNotProvided: 'Not Provided'
			}
		};

		return renderListPage(res, viewModel, logger);
	};

/**
 * Creates questionnaire detail controller for manage app.
 * Displays detailed view of a specific questionnaire submission.
 *
 * @param logger - Logger instance for recording operations
 * @param questionnaireService - Business service for questionnaire operations
 * @returns Express route handler function
 */
const createDetailController =
	(logger: ManageService['logger'], questionnaireService: any): AsyncRequestHandler =>
	async (req, res) => {
		const { id } = req.params as QuestionnaireDetailParams;
		logger.info(`Displaying questionnaire submission detail: ${id}`);

		const submission = await questionnaireService.getSubmissionById(id);

		if (!submission) {
			return handleNotFound(res, id, logger);
		}

		const viewModel: QuestionnaireDetailViewModel = {
			pageHeading: 'Questionnaire Submission',
			submission,
			questionnaireConfig: {
				backLinkText: 'Back to questionnaire list',
				backLinkHref: '/questionnaire',
				emailNotProvided: 'Not Provided'
			}
		};

		return renderDetailPage(res, viewModel, logger);
	};

/**
 * Factory function that creates all questionnaire controllers with their dependencies.
 * Sets up the data service, business logic service, and page handlers.
 *
 * @param manageService - The manage service containing database and logger
 * @returns Object containing all questionnaire controllers and services
 */
export const createQuestionnaireControllers = (manageService: ManageService) => {
	const questionnaireDataService = createQuestionnaireDataService(manageService.db, manageService.logger);
	const questionnaireService = createQuestionnaireService(manageService.logger, questionnaireDataService);

	return {
		listController: createListController(manageService.logger, questionnaireService),
		detailController: createDetailController(manageService.logger, questionnaireService),
		questionnaireService
	};
};
