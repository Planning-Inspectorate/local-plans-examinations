import type { Request, Response } from 'express';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';

const VIEW_PATH = 'views/manage-local-plans/gateway-2-submission/application-complete/index.njk';

/**
 * Renders the Application complete page.
 */
export function buildGetApplicationCompletePage(): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const reference = req.params.planReference;

		return res.render(VIEW_PATH, {
			pageTitle: 'Application complete',
			returnToPlanUrl: `/manage-local-plans/${reference}`
		});
	};
}
