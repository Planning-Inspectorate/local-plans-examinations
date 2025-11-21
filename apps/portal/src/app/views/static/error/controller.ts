import type { Handler } from 'express';
import type { PortalService } from '#service';

/**
 * Controller class for handling error page requests
 *
 * Provides handlers for various error scenarios including firewall errors
 * and other system-level error pages.
 */
class ErrorController {
	private readonly logger: PortalService['logger'];

	/**
	 * Creates a new ErrorController instance
	 *
	 * @param {PortalService['logger']} logger - Logger instance for error tracking
	 */
	constructor(logger: PortalService['logger']) {
		this.logger = logger;
	}

	/**
	 * Handles firewall error page requests
	 *
	 * Renders the firewall error template when users encounter
	 * network security restrictions or firewall blocks.
	 *
	 * @param {any} req - Express request object
	 * @param {any} res - Express response object
	 * @returns {Promise<void>} Rendered firewall error page
	 */
	firewallError = async (req: any, res: any) => {
		this.logger.warn('Firewall error page requested');
		return res.render('views/static/error/firewall-error.njk', {
			pageTitle: 'Firewall Error'
		});
	};
}

/**
 * Creates error controller instances with service dependencies
 *
 * @param {PortalService} service - Portal service containing logger and other dependencies
 * @returns {Object} Object containing error controller methods
 *
 * @example
 * ```typescript
 * const controllers = createErrorControllers(service);
 * router.get('/firewall-error', controllers.firewallError);
 * ```
 */
export function createErrorControllers(service: PortalService) {
	const controller = new ErrorController(service.logger);
	return {
		firewallError: controller.firewallError
	};
}

/**
 * Legacy function for backward compatibility
 *
 * @deprecated Use createErrorControllers instead
 * @param {PortalService} service - Portal service instance
 * @returns {Handler} Express handler for firewall error page
 */
export function firewallErrorPage(service: PortalService): Handler {
	return createErrorControllers(service).firewallError;
}
