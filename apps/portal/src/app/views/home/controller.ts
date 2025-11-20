import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';

/**
 * Controller class for handling home page requests
 *
 * Manages the main landing page functionality including database health checks
 * and visit tracking for demonstration purposes.
 */
class HomeController {
	private readonly db: PortalService['db'];
	private readonly logger: PortalService['logger'];

	constructor(db: PortalService['db'], logger: PortalService['logger']) {
		this.db = db;
		this.logger = logger;
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

		const viewModel = { connected, visitCount };
		this.logger.info({ viewModel }, 'home page');

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
	const controller = new HomeController(service.db, service.logger);
	return controller.handleHomePage;
}
