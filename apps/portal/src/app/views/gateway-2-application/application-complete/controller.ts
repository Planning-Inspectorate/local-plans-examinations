import type { Request, Response } from 'express';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';

const VIEW_PATH = 'views/gateway-2-application/application-complete/index.njk';

/**
 * Renders the Application complete page.
 */
export function buildGetApplicationCompletePage(): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const reference = req.params.reference;

		return res.render(VIEW_PATH, {
			pageTitle: 'Application complete',
			pageHeading: 'Application complete',
			pageCaption: 'Your application',
			backLinkUrl: `/manage-local-plans/${reference}`
		});
	};
}
