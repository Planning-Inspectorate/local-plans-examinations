import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { StageLabel, StatusTag, validPlan } from '../../types.ts';
import type { Plan } from '../../types.ts';

export function buildLandingPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		const councilLocation = 'Southampton City Council'; //TO BE CHANGED

		const rawPlans = await service.getPlans();

		let mappedPlans;
		let noPlansFlag = false;

		//check for if no plans
		if (!rawPlans.length) {
			logger.warn('No plans found');
			noPlansFlag = true;
		} else {
			//validates plans, raises error if invalid
			const validPlans: Plan[] = [];
			for (const rawplan of rawPlans) {
				if (validPlan(rawplan)) {
					validPlans.push(rawplan);
				} else {
					const planRef =
						typeof rawplan === 'object' && rawplan !== null && 'refNum' in rawplan ? rawplan.refNum : 'Invalid ref';
					logger.warn({ planRef }, 'Invalid plan');
				}
			}

			//maps tags to their classes and the text
			mappedPlans = validPlans.map((plan) => [
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
		}

		//content
		const viewModel = {
			plans: mappedPlans,
			noPlansFlag
		};

		//headings
		return res.render('views/landing-page/view.njk', {
			pageCaption: councilLocation,
			pageTitle: 'My plans',
			...viewModel
		});
	};
}
