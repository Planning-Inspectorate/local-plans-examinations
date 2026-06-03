import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { StageLabel, StatusTag, buildTestPlans, validPlan } from '../../types.ts';
import type { Plan } from '../../types.ts';

export function buildLandingPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		const councilLocation = 'Southampton City Council'; //TO BE CHANGED
		const rawPlans = buildTestPlans();

		//alidates plans, raises error if invalid
		const validPlans: Plan[] = [];
		for (const rawplan of rawPlans) {
			if (validPlan(rawplan)) {
				validPlans.push(rawplan);
			} else {
				const planRef =
					typeof rawplan === 'object' && rawplan !== null && 'refNum' in rawplan ? rawplan.refNum : 'Invalid ref';
				logger.warn({ planRef }, 'Invalid plan');
				//res.status(404).send("Invalid plan");
			}
		}

		//maps tags to their classes and the text
		const mappedPlans = validPlans.map((plan) => [
			{ html: `<a class="govuk-link" href="/planPage/${plan.refNum.replace('/', '-')}">${plan.refNum}</a>` },
			{ text: plan.leadLPA },
			{ text: plan.title },
			{ text: StageLabel[plan.stage] },
			{
				html: (() => {
					const s = StatusTag[plan.status];
					return `<strong class="${s.class}">${s.label}</strong>`;
				})()
			}
		]);

		//content
		const viewModel = {
			plans: mappedPlans
		};

		//headings
		return res.render('views/landingPage/view.njk', {
			pageCaption: councilLocation,
			pageTitle: 'My plans',
			...viewModel
		});
	};
}
