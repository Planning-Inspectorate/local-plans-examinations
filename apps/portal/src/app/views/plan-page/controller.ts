import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { StageLabel, StatusTag, validPlan } from '../../types.ts';
import type { Plan, Status } from '../../types.ts';

//takes status and mapping of label and class returns tags
function statusTag(status: Status, tagMap: typeof StatusTag) {
	const s = tagMap?.[status];
	return `<strong class="${s?.class ?? ''}">${s?.label}</strong>`;
}

export function buildPlanPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		//logic for finding correct plan
		const planRef = String(req.params['refNum']).replace('-', '/');
		const rawPlans = await service.getPlans();

		//checks if plan exists and is valid, logs error if fail
		const plan = (rawPlans as Plan[]).find((plan) => plan.refNum === planRef);
		if (!validPlan(plan)) {
			logger.warn({ planRef }, 'Plan not found');
			res.status(404).send('Plan not found');
			return;
		}

		const planStatusTag = statusTag(plan.status, StatusTag);
		const currentStage = StageLabel[plan.stage];
		const applicationLinkNoStage = `/applicationPage/${req.params['refNum']}/`;
		const currentApplicationLink = `/applicationPage/${req.params['refNum']}/${plan.stage}`;

		//button logic
		let button = null;
		if (plan.status === 0) {
			//Ready to start
			button = 'Start ' + currentStage + ' submission';
		}

		//notification banner logic
		let notificationBanner = null;
		if (plan.status === 3) {
			//action needed
			notificationBanner = true;
		}

		//plan process tag logic
		let tagG2, tagG3, tagE;
		let dateTextG2, dateTextG3, dateTextE;
		let hrefG2, hrefG3, hrefE;
		hrefG2 = hrefG3 = hrefE = null;
		tagG2 = tagG3 = tagE = 'Cannot start yet';
		dateTextG2 = dateTextG3 = dateTextE = 'Target date: ';
		switch (plan.stage) {
			case 1:
				hrefG2 = currentApplicationLink;
				tagG2 = planStatusTag;
				break;
			case 2:
				dateTextG2 = 'Completed on:';
				hrefG2 = applicationLinkNoStage + `1`;
				hrefG3 = currentApplicationLink;
				tagG2 = 'Completed';
				tagG3 = planStatusTag;
				break;
			case 3: // logic for if all complete
				hrefG2 = applicationLinkNoStage + `1`;
				hrefG3 = applicationLinkNoStage + `2`;
				hrefE = currentApplicationLink;
				if (plan.status === 5) {
					dateTextG2 = dateTextG3 = dateTextE = 'Completed on: ';
					tagG2 = tagG3 = tagE = 'Completed';
				} else {
					dateTextG2 = dateTextG3 = 'Completed on: ';
					tagE = planStatusTag;
					tagG2 = tagG3 = 'Completed';
				}
				break;
		}

		const viewModel = {
			dateG1: plan.dates.G1,
			dateG2: plan.dates.G2,
			dateG3: plan.dates.G3,
			dateE: plan.dates.E,
			dateTextG2,
			dateTextG3,
			dateTextE,
			tagG2,
			tagG3,
			tagE,
			hrefG2,
			hrefG3,
			hrefE
		};

		return res.render('views/plan-page/view.njk', {
			pageCaption: planRef,
			pageTitle: plan.title,
			currentStage,
			planStatusTag,
			status: plan.status,
			leadLPA: plan.leadLPA,
			linkedLPA: plan.linkedLPA,
			button,
			notificationBanner,
			backLinkUrl: '/landingPage',
			backLinkText: 'Back to my plans',
			currentApplicationLink,
			...viewModel
		});
	};
}
