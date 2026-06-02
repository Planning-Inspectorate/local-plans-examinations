import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import fs from 'node:fs'; //added assume ok?
import { StageLabel, StatusTag } from '../../types.ts';
import type { Plan } from '../../types.ts';
import { validPlan } from '../../types.ts';

export function buildLandingPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		const councilLocation = 'Southampton City Council'; //TO BE CHANGED
		const rawPlans = JSON.parse(fs.readFileSync('src/app/testData.json', 'utf-8'));

		//alidates plans, raises error if invalid
		const validPlans: Plan[] = [];
		for (const rawplan of rawPlans) {
			if (validPlan(rawplan)) {
				validPlans.push(rawplan);
			} else {
				logger.warn({ planRef: rawplan.refNum }, 'Plan not found');
				res.status(404).send('Plan not found');
				return;
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
					return `<strong class=" ${s?.class ?? ''}">
					${s?.label ?? 'Unknown'}
					</strong>`;
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
