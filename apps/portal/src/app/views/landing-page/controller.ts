import type { PortalService } from '#service';
import { getExaminationStatusTagClass } from '#util/examination-status-tag.ts';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import { STAGE, StageLabel, StatusTag, validPlan } from '../../types.ts';
import type { Plan } from '../../types.ts';
import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

function planStatusTag(plan: Plan): string {
	if (plan.stage === STAGE.Examination && plan.examinationStatus !== EXAMINATION_STATUS_ID.CANNOT_START_YET) {
		const classes = getExaminationStatusTagClass(plan.examinationStatus);
		return classes ? `<strong class="${classes}">${plan.examinationStatusLabel}</strong>` : plan.examinationStatusLabel;
	}

	const status = StatusTag[plan.status];
	return `<strong class="${status.class}">${status.label}</strong>`;
}

/** A govukTable cell: plain text or HTML (not escaped by the template). */
type TableCell = { text: string } | { html: string };

/**
 * Data passed to `views/landing-page/view.njk` by `GET /manage-local-plans/your-plans`.
 * `pageTitle` and `pageCaption` are also read by `views/layouts/main.njk`.
 */
export interface LandingPageViewModel {
	/** Lead LPA of the first valid plan, rendered as the page caption; `undefined` when there are no plans */
	pageCaption: string | undefined;
	pageTitle: string;
	/** Table rows: reference link, lead LPA, title, stage, status tag; `undefined` when there are no plans */
	plans: TableCell[][] | undefined;
	/** Shows "No plans available" instead of the table */
	noPlansFlag: boolean;
}

export function buildLandingPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		const rawPlans: unknown[] = await service.getPlans(req.session.authenticatedEmail);

		let mappedPlans: TableCell[][] | undefined;
		let pageCaption: string | undefined;
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

		const viewModel = {
			pageCaption,
			pageTitle: 'My plans',
			plans: mappedPlans,
			noPlansFlag
		} satisfies LandingPageViewModel;

		return res.render('views/landing-page/view.njk', viewModel);
	};
}
