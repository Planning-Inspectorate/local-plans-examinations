import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import fs from 'node:fs'; //added assume ok?
import type { StatusType } from '../../../types/types.ts';
import { StageLabel } from '../../../types/types.ts';
import type { Plan } from '../../../types/types.ts';
import { StatusColour } from '../../../types/types.ts';

//takes status and mapping of label and class returns tags
function statusTag(status: StatusType, tagMap: typeof StatusColour) {
	const s = tagMap?.[status];
	return `<strong class=" ${s?.class ?? ''}">
        ${s?.label ?? 'Unknown'}
    </strong>`;
}

export function buildPlanPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;

	return async (req, res) => {
		const planRef = String(req.params['refNum']).replace('-', '/');

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

		//console.log(rawPlans)
		//console.log(validPlans)

		//checks if plan exists logs error if fail
		const plan = validPlans.find((p) => p.refNum == planRef);
		if (!plan) {
			logger.warn({ planRef }, 'Plan not found');
			res.status(404).send('Plan not found');
			return;
		}

		const planTag = statusTag(plan.status, StatusColour);
		const currentStage = StageLabel[plan.stage];

		//button logic
		let button = null;
		if (plan.status == 0) {
			//Ready to start
			button = 'Start ' + currentStage + ' submission';
		} else if (plan.status == 3) {
			//Action needed
			button = 'Continue ' + currentStage + ' submission';
		}

		//notification banner logic
		//assume used when stage fails?
		let notificationBanner = null;
		if (plan.status == 3) {
			//action needed
			notificationBanner = true;
		}

		//plan process tag logic
		const dates = plan.dates.split('|');
		let tagG2, tagG3, tagE;
		let dateTextG2, dateTextG3, dateTextE;
		tagG2 = tagG3 = tagE = 'Cannot start yet';
		dateTextG2 = dateTextG3 = dateTextE = 'Target date: ';
		console.log(plan.stage, tagG2, tagG3, tagE);
		switch (plan.stage) {
			case 0:
				tagG2 = planTag;
				break;
			case 1:
				dateTextG2 = 'Completed on:';
				tagG2 = 'Completed';
				tagG3 = planTag;
				break;
			case 2: // logic for if all complete
				if (plan.status == 5) {
					dateTextG2 = dateTextG3 = dateTextE = 'Completed on: ';
					tagG2 = tagG3 = tagE = 'Completed';
				} else {
					dateTextG2 = dateTextG3 = 'Completed on: ';
					tagE = planTag;
					tagG2 = tagG3 = 'Completed';
				}
				break;
		}

		const viewModel = {
			//message: 'Questionnaire',
			plans: 'plans'
		};

		return res.render('views/planPage/view.njk', {
			pageCaption: planRef,
			pageTitle: plan.title,
			currentStage: currentStage,
			status: planTag,
			leadLPA: plan.leadLPA,
			linkedLPA: plan.linkedLPA,
			button: button,
			dateG1: dates[0],
			dateG2: dates[1],
			dateG3: dates[2],
			dateE: dates[3],
			dateTextG2: dateTextG2,
			dateTextG3: dateTextG3,
			dateTextE: dateTextE,
			tagG2: tagG2,
			tagG3: tagG3,
			tagE: tagE,
			notificationBanner: notificationBanner,
			backLinkUrl: '/landingPage',
			backLinkText: 'Back to my plans',

			...viewModel
		});
	};
}
