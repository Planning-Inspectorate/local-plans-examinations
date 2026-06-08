import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { StageLabel, StatusTag, buildTestPlans, validPlan, testPlan } from '../../types.ts';
import type { Plan } from '../../types.ts';

// test set to false when running from database - used for testing
// getPlans used for passing in test data
export function buildLandingPage(
	service: PortalService,
	test: boolean = true,
	getPlans?: typeof buildTestPlans
): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		const councilLocation = 'Southampton City Council'; //TO BE CHANGED

		//logic for data source: database, test (on localhost), test (actual)
		let rawPlans: unknown[];
		if (!test && getPlans === undefined) {
			//used for database - to be changed
			rawPlans = testPlan;
		} else if (test && getPlans === undefined) {
			//used for running on local for demo
			rawPlans = buildTestPlans();
		} else if (test && getPlans !== undefined) {
			//used for running on tests
			rawPlans = getPlans();
		} else {
			// error state
			logger.error('test data provided without test flag');
			return;
		}

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
		return res.render('views/landingPage/view.njk', {
			pageCaption: councilLocation,
			pageTitle: 'My plans',
			...viewModel
		});
	};
}
