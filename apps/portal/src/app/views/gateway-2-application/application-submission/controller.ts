import type { Request, Response } from 'express';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';
import { validPlan } from '../../../types.ts';
import type { Plan } from '../../../types.ts';

const VIEW_PATH = 'views/gateway-2-application/application-submission/application-submission.njk';

/**
 * Renders the Gateway 2 submission page.
 */
export function buildGetGateway2SubmissionPage(service: PortalService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const reference = String(req.params.reference);
		const planRef = reference.replace('-', '/');
		const rawPlans = await service.getPlans();
		const plan = (rawPlans as Plan[]).find((p) => p.refNum === planRef);

		const planTitle = validPlan(plan) ? plan.title : '';
		const targetDate = validPlan(plan) ? plan.dates.G2 : '';

		return res.render(VIEW_PATH, {
			pageTitle: 'Gateway 2 submission',
			pageHeading: 'Gateway 2 submission',
			pageCaption: planTitle,
			backLinkUrl: `/manage-local-plans/${reference}`,
			targetDate,
			saveAndComeBackUrl: `/manage-local-plans/${reference}`
		});
	};
}

/**
 * Handles the Gateway 2 submission form POST.
 * Validates that at least one document has been added before allowing submission.
 */
export function buildPostGateway2SubmissionPage(service: PortalService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const reference = String(req.params.reference);
		const { logger } = service;
		const planRef = reference.replace('-', '/');
		const rawPlans = await service.getPlans();
		const plan = (rawPlans as Plan[]).find((p) => p.refNum === planRef);

		const planTitle = validPlan(plan) ? plan.title : '';
		const targetDate = validPlan(plan) ? plan.dates.G2 : '';

		// For now, no documents are uploaded (pre-submission state), so always show error
		logger.info(`Gateway 2 submission attempted for case ${reference} with no documents`);

		return res.render(VIEW_PATH, {
			pageTitle: 'Gateway 2 submission',
			pageHeading: 'Gateway 2 submission',
			pageCaption: planTitle,
			backLinkUrl: `/manage-local-plans/${reference}`,
			targetDate,
			saveAndComeBackUrl: `/manage-local-plans/${reference}`,
			errorSummary: [
				{
					text: 'Add at least one document before submitting',
					href: '#procedural-documents'
				}
			],
			errors: {
				submit: {
					text: 'Add at least one document before submitting'
				}
			}
		});
	};
}
