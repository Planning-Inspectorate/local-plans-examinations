import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { DatabaseService } from '@pins/local-plans-lib/database';
import { QuestionnaireService as QuestionnaireDataService } from '../questionnaire/data/service.ts';

/**
 * Controller class for handling home page requests
 *
 * Manages the main landing page functionality including database health checks,
 * visit tracking, and questionnaire statistics display.
 */
class HomeController {
	private readonly db: PortalService['db'];
	private readonly logger: PortalService['logger'];
	private readonly questionnaireService: any;

	constructor(db: PortalService['db'], logger: PortalService['logger'], questionnaireService: any) {
		this.db = db;
		this.logger = logger;
		this.questionnaireService = questionnaireService;
	}

	/**
	 * Handles home page requests
	 *
	 * @param {any} req - Express request object
	 * @param {any} res - Express response object
	 * @returns {Promise<void>} Rendered home page
	 */
	handleHomePage = async (req: any, res: any) => {
		const connected = await this.checkDatabaseConnection();
		const visitCount = this.updateVisitCount(req);
		const totalSubmissions = await this.getTotalSubmissions();

		const viewModel = { connected, visitCount, totalSubmissions };
		this.logger.info({ viewModel }, 'Home Page View Model');

		return res.render('views/home/view.njk', {
			pageTitle: 'Local Plans Examination Service',
			...viewModel
		});
	};

	/**
	 * Checks database connectivity by executing a simple query
	 *
	 * @returns {Promise<boolean>} True if database is accessible, false otherwise
	 * @private
	 */
	private async checkDatabaseConnection(): Promise<boolean> {
		try {
			await this.db.$queryRaw`SELECT 1`;
			return true;
		} catch (error) {
			this.logger.error({ error }, 'Database connection failed');
			return false;
		}
	}

	/**
	 * Gets total number of questionnaire submissions
	 *
	 * @returns {Promise<number>} Total questionnaire submissions count
	 * @private
	 */
	private async getTotalSubmissions(): Promise<number> {
		try {
			return await this.questionnaireService.getTotalSubmissions();
		} catch (error) {
			this.logger.error({ error }, 'Failed to get total submissions');
			return 0; // Return 0 if database query fails
		}
	}

	/**
	 * Updates and returns the visit count stored in session
	 *
	 * @param {any} req - Express request object with session
	 * @returns {number} Updated visit count
	 * @private
	 */
	private updateVisitCount(req: any): number {
		req.session.visits = (req.session.visits || 0) + 1;
		return req.session.visits;
	}
}

/**
 * Factory function that creates a home page request handler
 *
 * @param {PortalService} service - Portal service instance for dependency injection
 * @returns {AsyncRequestHandler} Express async request handler for home page
 */
export function buildHomePage(service: PortalService): AsyncRequestHandler {
	const databaseService = new DatabaseService(service.db, service.logger);
	const questionnaireDataService = new QuestionnaireDataService(databaseService, service.logger);
	const controller = new HomeController(service.db, service.logger, questionnaireDataService);
	return controller.handleHomePage;
}
