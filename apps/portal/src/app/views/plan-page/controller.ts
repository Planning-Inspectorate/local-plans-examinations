import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import { STAGE, STATUS, StageLabel, StatusTag, validPlan } from '../../types.ts';
import type { Plan, Status } from '../../types.ts';
import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

function statusTag(status: Status) {
	const s = StatusTag[status as keyof typeof StatusTag] as { label: string; class: string } | undefined;
	return s ? (s.class ? `<strong class="${s.class}">${s.label}</strong>` : s.label) : '';
}

const examinationStatusClasses: Record<string, string> = {
	[EXAMINATION_STATUS_ID.READY_TO_START]: 'govuk-tag govuk-tag--green',
	[EXAMINATION_STATUS_ID.IN_PROGRESS]: 'govuk-tag govuk-tag--blue',
	[EXAMINATION_STATUS_ID.SUBMITTED]: 'govuk-tag govuk-tag--yellow',
	[EXAMINATION_STATUS_ID.IN_EXAMINATION]: 'govuk-tag govuk-tag--blue',
	[EXAMINATION_STATUS_ID.PAUSED]: 'govuk-tag govuk-tag--grey',
	[EXAMINATION_STATUS_ID.REPORT_ISSUED]: 'govuk-tag govuk-tag--turquoise',
	[EXAMINATION_STATUS_ID.PLAN_ADOPTED]: 'govuk-tag govuk-tag--green'
};

function examinationStatusTag(plan: Plan) {
	const classes = examinationStatusClasses[plan.examinationStatus];
	return classes ? `<strong class="${classes}">${plan.examinationStatusLabel}</strong>` : plan.examinationStatusLabel;
}

export function buildPlanPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		const planRef = String(req.params.refNum);
		const rawPlans = await service.getPlans();
		const plan = (rawPlans as Plan[]).find((plan) => plan.refNum === planRef);
		if (!validPlan(plan)) {
			logger.warn({ planRef }, 'Plan not found');
			res.status(404).send('Plan not found');
			return;
		}

		const examinationAvailable = plan.examinationStatus !== EXAMINATION_STATUS_ID.CANNOT_START_YET;
		const planStatus =
			plan.stage === STAGE.Examination && examinationAvailable ? examinationStatusTag(plan) : statusTag(plan.status);
		const currentStage = StageLabel[plan.stage];
		const encodedPlanRef = encodeURIComponent(plan.refNum);
		const applicationBase = `/manage-local-plans/${encodedPlanRef}/gateway-2-submission`;
		const gateway3Base = `/manage-local-plans/${encodedPlanRef}/gateway-3-submission`;
		const gateway3ResubBase = `/manage-local-plans/${encodedPlanRef}/gateway-3-resubmission`;
		const examinationBase = `/manage-local-plans/${encodedPlanRef}/examination-submission`;
		const isResubmissionRequired = plan.status === STATUS.ResubmissionRequired;
		const currentApplicationLink =
			plan.stage === STAGE.Examination
				? examinationBase
				: isResubmissionRequired
					? gateway3ResubBase
					: plan.stage === STAGE.Gateway3
						? gateway3Base
						: `${applicationBase}/application-declaration`;
		const applicationLink = () => applicationBase;
		const gateway3Link = () => (isResubmissionRequired ? gateway3ResubBase : gateway3Base);
		const examinationLink = () => examinationBase;

		const button =
			plan.stage === STAGE.Examination
				? plan.examinationStatus === EXAMINATION_STATUS_ID.READY_TO_START
					? 'Start Examination submission'
					: null
				: plan.status === STATUS.ReadyToStart
					? `Start ${currentStage} submission`
					: null;

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
				hrefG2 = applicationLink();
				tagG2 = planStatus;
				if (plan.status === STATUS.UnderReview) {
					dateTextG2 = 'Submitted: ';
				}
				break;
			case STAGE.Gateway3:
				dateTextG2 = 'Completed: ';
				if (plan.status === STATUS.UnderReview) {
					dateTextG3 = 'Submitted: ';
				}
				hrefG2 = applicationLink();
				hrefG3 = gateway3Link();
				tagG2 = 'Completed';
				tagG3 = planStatus;
				if (isResubmissionRequired || plan.status === STATUS.UnderReview) {
					dateTextG3 = 'Submitted: ';
				}
				break;
			case STAGE.Examination:
				hrefG2 = applicationLink();
				hrefG3 = gateway3Link();
				hrefE = examinationAvailable ? examinationLink() : null;
				if (plan.status === STATUS.Completed) {
					dateTextG2 = dateTextG3 = dateTextE = 'Completed: ';
					tagG2 = tagG3 = tagE = 'Completed';
				} else {
					dateTextG2 = dateTextG3 = 'Completed: ';
					if (plan.examinationStatus === EXAMINATION_STATUS_ID.SUBMITTED) {
						dateTextE = 'Submitted: ';
					}
					tagE = examinationAvailable ? examinationStatusTag(plan) : 'Cannot start yet';
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
			backLinkUrl: '/manage-local-plans/your-plans',
			backLinkText: 'Back to my plans',
			currentApplicationLink,
			...viewModel
		});
	};
}
