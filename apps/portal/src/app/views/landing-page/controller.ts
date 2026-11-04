import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import { validPlan } from '../../types.ts';
import type { Plan } from '../../types.ts';

export function buildLandingPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		const rawPlans: unknown[] = await service.getPlans(req.session.authenticatedEmail);

		if (!rawPlans.length) {
			logger.warn('No plans found');
		}

		const validPlans: Plan[] = rawPlans.reduce((acc: Plan[], rawplan) => {
			if (validPlan(rawplan)) {
				acc.push(rawplan);
			} else {
				const planRef =
					typeof rawplan === 'object' && rawplan !== null && 'refNum' in rawplan ? rawplan.refNum : 'Invalid ref';
				logger.warn({ planRef }, 'Invalid plan');
			}
			return acc;
		}, []);

		const mappedPlans = validPlans.map((plan) => [
			{
				html: `<a class="govuk-link" data-cy="plan-link" href="/manage-local-plans/${encodeURIComponent(plan.refNum)}">${plan.refNum}</a>`
			},
			{ text: plan.leadLPA },
			{ text: plan.title },
			{ text: plan.type }
		]);

		const pageCaption = validPlans[0].leadLPA;

		//content
		const viewModel = {
			plans: mappedPlans,
			noPlansFlag: validPlans.length === 0
		};

		//headings
		return res.render('views/landing-page/view.njk', {
			pageCaption,
			pageTitle: 'My plans',
			...viewModel
		});
	};
}
