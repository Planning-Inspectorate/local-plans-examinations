import type { Handler } from 'express';
import type { PortalService } from '#service';

export function firewallErrorPage(service: PortalService): Handler {
	return async (req, res) => {
		service.logger.warn('Firewall error page requested');
		return res.render('views/static/error/firewall-error.njk', {
			pageTitle: 'Firewall Error'
		});
	};
}
