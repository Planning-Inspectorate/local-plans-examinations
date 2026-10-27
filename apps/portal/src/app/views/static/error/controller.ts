import type { Handler } from 'express';
import type { PortalService } from '#service';
import { renderSubmissionFailurePage } from './submission-failure.ts';

/**
 * Simple firewall error page
 * @param service
 */
export function firewallErrorPage(service: PortalService): Handler {
	return async (req, res) => {
		service.logger.warn('Firewall error page requested');
		return res.render('views/static/error/firewall-error.njk', {
			pageTitle: 'Firewall Error'
		});
	};
}

/**
 * Shared 'failed submission' error page.
 *
 * Shown when a submission (Gateway 2, Gateway 3, Gateway 3 resubmission or Examination)
 * could not be completed, for example because of a database failure.
 */
export function submissionFailurePage(service: PortalService): Handler {
	return async (req, res) => {
		const planReference = typeof req.query.planReference === 'string' ? req.query.planReference : undefined;
		service.logger.warn({ planReference }, 'Submission failure page requested');
		return renderSubmissionFailurePage(res, { planReference });
	};
}
