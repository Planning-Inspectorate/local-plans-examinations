import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import fs from 'node:fs'; //added assume ok?ß
import { StageLabel } from '../../../types/types.ts';
import type { Plan } from '../../../types/types.ts';
import { StatusColour } from '../../../types/types.ts';

export function buildLandingPage(): AsyncRequestHandler {
	return async (req, res) => {
		const councilLocation = 'Southampton City Council'; //TO BE CHANGED
		const rawPlans = JSON.parse(fs.readFileSync('./testData.json', 'utf-8'));

		//filters and validates plans
		//---------currently just removes inccorect or incomplete records ----------
		const validPlans: Plan[] = rawPlans.filter((rawPlan: unknown): rawPlan is Plan => {
			if (typeof rawPlan !== 'object' || rawPlan === null) return false;
			const recordPlan = rawPlan as Record<string, unknown>;
			return (
				typeof recordPlan.refNum === 'string' &&
				typeof recordPlan.leadLPA === 'string' &&
				typeof recordPlan.title === 'string' &&
				typeof recordPlan.stage === 'number' &&
				typeof recordPlan.status === 'number' &&
				recordPlan.stage >= 0 &&
				recordPlan.stage <= 3 &&
				recordPlan.status >= 0 &&
				recordPlan.status <= 5
			);
		});

		//maps tags to their classes and the text
		const mappedPlans = validPlans.map((plan) => [
			{ html: `<a class="govuk-link" href="/planPage/${plan.refNum.replace('/', '-')}">${plan.refNum}</a>` },
			{ text: plan.leadLPA },
			{ text: plan.title },
			{ text: StageLabel[plan.stage] },
			{
				html: (() => {
					const s = StatusColour[plan.status];
					return `<strong class=" ${s?.class ?? ''}">
					${s?.label ?? 'Unknown'}
					</strong>`;
				})()
			}
		]);

		const viewModel = {
			//message: 'Questionnaire',
			plans: mappedPlans
		};

		//console.log(rawPlans)
		//logger.info({ viewModel }, 'page78');

		return res.render('views/landingPage/view.njk', {
			pageCaption: councilLocation,
			pageTitle: 'My Plans',

			...viewModel
		});
	};
}
