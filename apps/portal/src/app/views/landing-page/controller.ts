import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import { STAGE, StageLabel, StatusTag, validPlan } from '../../types.ts';
import type { Plan } from '../../types.ts';
import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

const examinationStatusClasses: Record<string, string> = {
	[EXAMINATION_STATUS_ID.READY_TO_START]: 'govuk-tag govuk-tag--green',
	[EXAMINATION_STATUS_ID.IN_PROGRESS]: 'govuk-tag govuk-tag--blue',
	[EXAMINATION_STATUS_ID.SUBMITTED]: 'govuk-tag govuk-tag--yellow',
	[EXAMINATION_STATUS_ID.IN_EXAMINATION]: 'govuk-tag govuk-tag--blue',
	[EXAMINATION_STATUS_ID.PAUSED]: 'govuk-tag govuk-tag--grey',
	[EXAMINATION_STATUS_ID.REPORT_ISSUED]: 'govuk-tag govuk-tag--turquoise',
	[EXAMINATION_STATUS_ID.PLAN_ADOPTED]: 'govuk-tag govuk-tag--purple'
};

function planStatusTag(plan: Plan): string {
	if (plan.stage === STAGE.Examination && plan.examinationStatus !== EXAMINATION_STATUS_ID.CANNOT_START_YET) {
		const classes = examinationStatusClasses[plan.examinationStatus];
		return classes ? `<strong class="${classes}">${plan.examinationStatusLabel}</strong>` : plan.examinationStatusLabel;
	}

	const status = StatusTag[plan.status];
	return `<strong class="${status.class}">${status.label}</strong>`;
}

export function buildLandingPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		const rawPlans: unknown[] = await service.getPlans(req.session.authenticatedEmail);

		let mappedPlans;
		let pageCaption;
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

			pageCaption = validPlans[0]?.leadLPA;

			//maps tags to their classes and the text
			mappedPlans = validPlans.map((plan) => [
				{
					html: `<a class="govuk-link" data-cy="plan-link" href="/manage-local-plans/${encodeURIComponent(plan.refNum)}">${plan.refNum}</a>`
				},
				{ text: plan.leadLPA },
				{ text: plan.title },
				{ text: StageLabel[plan.stage] },
				{ html: planStatusTag(plan) }
			]);
		}

		//content
		const viewModel = {
			plans: mappedPlans,
			noPlansFlag
		};

		//headings
		return res.render('views/landing-page/view.njk', {
			pageCaption,
			pageTitle: 'My plans',
			...viewModel
		});
	};
}
