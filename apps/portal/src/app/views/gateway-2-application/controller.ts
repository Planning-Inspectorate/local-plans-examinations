import type { Request, Response } from 'express';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';

const VIEW_PATH = 'views/gateway-2-application/index.njk';

/**
 * Renders the Gateway 2 application page.
 */
export function buildGetGateway2ApplicationPage(): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const reference = req.params.reference;

		return res.render(VIEW_PATH, {
			pageTitle: 'Gateway 2 application',
			pageHeading: 'Gateway 2 application',
			pageCaption: 'Your application',
			backLinkUrl: `/manage-local-plans/${reference}`
		});
	};
}
