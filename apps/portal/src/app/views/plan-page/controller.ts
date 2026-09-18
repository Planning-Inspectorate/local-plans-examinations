import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
// import { StatusTag } from '../../types.ts';
// import type {  Status } from '../../types.ts';
//
// function statusTag(status: Status) {
// 	const s = StatusTag[status as keyof typeof StatusTag] as { label: string; class: string } | undefined;
// 	return s ? (s.class ? `<strong class="${s.class}">${s.label}</strong>` : s.label) : '';
// }

export function buildPlanPage(service: PortalService): AsyncRequestHandler {
	const { logger, db } = service;
	return async (req, res) => {
		const planReference = String(req.params.planReference);
		let caseData;
		try {
			caseData = await db.case.findUnique({
				where: { reference: planReference }
			});
		} catch (error) {
			logger.error({ error, planReference }, 'Error fetching plan from database');
			res.status(500).send('Internal Server Error');
			return;
		}

		if (!caseData) {
			logger.warn({ planReference }, 'Plan not found');
			res.status(404).send('Plan not found');
			return;
		}
		// status, stage, ready to start,

		// const planStatus = statusTag(caseData.status);
		// const currentStage = StageLabel[plan.stage];
		// const encodedPlanRef = encodeURIComponent(plan.planReference);
		// const applicationBase = `/manage-local-plans/${encodedPlanRef}/gateway-2-submission`;
		// const gateway3Base = `/manage-local-plans/${encodedPlanRef}/gateway-3-submission`;
		// const currentApplicationLink =
		// 	plan.stage === STAGE.Gateway3 ? gateway3Base : `${applicationBase}/application-declaration`;
		// const applicationLink = () => applicationBase;
		// const gateway3Link = () => gateway3Base;
		//
		// const button = plan.status === STATUS.ReadyToStart ? `Start ${currentStage} submission` : null;
		//
		// const notificationBanner = plan.status === STATUS.ActionNeeded;
		//
		// // Task list tags and links based on current stage
		// let tagG2, tagG3, tagE;
		// let dateTextG2, dateTextG3, dateTextE;
		// let hrefG2, hrefG3, hrefE;
		// hrefG2 = hrefG3 = hrefE = null;
		// tagG2 = tagG3 = tagE = 'Cannot start yet';
		// dateTextG2 = dateTextG3 = dateTextE = 'Target date: ';
		// switch (plan.stage) {
		// 	case STAGE.Gateway2:
		// 		hrefG2 = applicationLink();
		// 		tagG2 = planStatus;
		// 		if (plan.status === STATUS.UnderReview) {
		// 			dateTextG2 = 'Submitted: ';
		// 		}
		// 		break;
		// 	case STAGE.Gateway3:
		// 		dateTextG2 = 'Completed on:';
		// 		hrefG2 = applicationLink();
		// 		hrefG3 = gateway3Link();
		// 		tagG2 = 'Completed';
		// 		tagG3 = planStatus;
		// 		break;
		// 	case STAGE.Examination:
		// 		hrefG2 = applicationLink();
		// 		hrefG3 = gateway3Link();
		// 		hrefE = applicationLink();
		// 		if (plan.status === STATUS.Completed) {
		// 			dateTextG2 = dateTextG3 = dateTextE = 'Completed on: ';
		// 			tagG2 = tagG3 = tagE = 'Completed';
		// 		} else {
		// 			dateTextG2 = dateTextG3 = 'Completed on: ';
		// 			tagE = planStatus;
		// 			tagG2 = tagG3 = 'Completed';
		// 		}
		// 		break;
		// }
		//
		// const viewModel = {
		// 	dateG1: plan.dates.G1,
		// 	dateG2: plan.dates.G2,
		// 	dateG3: plan.dates.G3,
		// 	dateE: plan.dates.E,
		// 	dateTextG2,
		// 	dateTextG3,
		// 	dateTextE,
		// 	tagG2,
		// 	tagG3,
		// 	tagE,
		// 	hrefG2,
		// 	hrefG3,
		// 	hrefE
		// };

		return res.render('views/plan-page/view.njk', {
			pageCaption: planReference,
			pageTitle: caseData.planTitle,
			// currentStage,
			// planStatus,
			// status: plan.status,
			// leadLPA: caseData.leadLPA,
			// linkedLPA: plan.linkedLPA,
			// button,
			// notificationBanner,
			backLinkUrl: '/manage-local-plans/your-plans',
			backLinkText: 'Back to my plans'
			// currentApplicationLink,
			// ...viewModel
		});
	};
}
