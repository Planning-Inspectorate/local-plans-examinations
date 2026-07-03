import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { STAGE, STATUS, StageLabel, StatusTag, validPlan } from '../../types.ts';
import type { Plan, Status } from '../../types.ts';

function statusTag(status: Status) {
	const s = StatusTag[status as keyof typeof StatusTag] as { label: string; class: string } | undefined;
	return s ? (s.class ? `<strong class="${s.class}">${s.label}</strong>` : s.label) : '';
}

export function buildPlanPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		// Route uses PLAN-001 but stored plans use PLAN/001
		const planRef = String(req.params.refNum).replace('-', '/');
		const rawPlans = await service.getPlans();
		const plan = (rawPlans as Plan[]).find((plan) => plan.refNum === planRef);
		if (!validPlan(plan)) {
			logger.warn({ planRef }, 'Plan not found');
			res.status(404).send('Plan not found');
			return;
		}

		const planStatus = statusTag(plan.status);
		const currentStage = StageLabel[plan.stage];
		const applicationBase = `/applicationPage/${req.params.refNum}`;
		const currentApplicationLink = `${applicationBase}/${plan.stage}`;
		const applicationLink = (stage: number) => `${applicationBase}/${stage}`;

		const button = plan.status === STATUS.ReadyToStart ? `Start ${currentStage} submission` : null;

		const notificationBanner = plan.status === STATUS.ActionNeeded;

		// Task list tags and links based on current stage
		let tagG2, tagG3, tagE;
		let dateTextG2, dateTextG3, dateTextE;
		let hrefG2, hrefG3, hrefE;
		hrefG2 = hrefG3 = hrefE = null;
		tagG2 = tagG3 = tagE = 'Cannot start yet';
		dateTextG2 = dateTextG3 = dateTextE = 'Target date: ';
		switch (plan.stage) {
			case STAGE.Gateway2:
				hrefG2 = currentApplicationLink;
				tagG2 = planStatus;
				break;
			case STAGE.Gateway3:
				dateTextG2 = 'Completed on:';
				hrefG2 = applicationLink(STAGE.Gateway2);
				hrefG3 = currentApplicationLink;
				tagG2 = 'Completed';
				tagG3 = planStatus;
				break;
			case STAGE.Examination:
				hrefG2 = applicationLink(STAGE.Gateway2);
				hrefG3 = applicationLink(STAGE.Gateway3);
				hrefE = currentApplicationLink;
				if (plan.status === STATUS.Completed) {
					dateTextG2 = dateTextG3 = dateTextE = 'Completed on: ';
					tagG2 = tagG3 = tagE = 'Completed';
				} else {
					dateTextG2 = dateTextG3 = 'Completed on: ';
					tagE = planStatus;
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
			planStatus,
			status: plan.status,
			leadLPA: plan.leadLPA,
			linkedLPA: plan.linkedLPA,
			button,
			notificationBanner,
			backLinkUrl: '/your-plans',
			backLinkText: 'Back to my plans',
			currentApplicationLink,
			...viewModel
		});
	};
}
