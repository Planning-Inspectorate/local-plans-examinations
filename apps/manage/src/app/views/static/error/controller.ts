import type { Handler } from 'express';
import type { ManageService } from '#service';

/**
 * Builds firewall error page controller
 *
 * Creates controller that displays firewall error page when access is blocked.
 * Logs warning and renders appropriate error template for blocked requests.
 *
 * @param {ManageService} service - Manage app service containing logger
 * @returns {Handler} Express request handler for firewall error page
 */
export function firewallErrorPage(service: ManageService): Handler {
	return async (req, res) => {
		service.logger.warn('Firewall error page requested');
		return res.render('views/static/error/firewall-error.njk', {
			pageTitle: 'Firewall Error'
		});
	};
}
