import type { PortalService } from '#service';
import { getExaminationStatusTagClass } from '#util/examination-status-tag.ts';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import { STAGE, STATUS, StageLabel, StatusTag, validPlan } from '../../types.ts';
import type { Plan, Status } from '../../types.ts';
import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

function statusTag(status: Status) {
	const s = StatusTag[status as keyof typeof StatusTag] as { label: string; class: string } | undefined;
	return s ? (s.class ? `<strong class="${s.class}">${s.label}</strong>` : s.label) : '';
}

/**
 * Data passed to `views/plan-page/view.njk` by `GET /manage-local-plans/:refNum`.
 * All properties are always set; nullable values are explicit.
 * Properties are also read by `views/layouts/main.njk` (title, caption, back link).
 */
export interface PlanPageViewModel {
	/** Plan reference, rendered as the page caption */
	pageCaption: string;
	/** Plan title, rendered as the page heading */
	pageTitle: string;
	/** Label of the plan's current stage, e.g. `Gateway 2` */
	currentStage: string;
	/** Status tag HTML for the current stage (not escaped by the template) */
	planStatus: string;
	/** Raw status of the current stage */
	status: Status;
	leadLPA: string;
	linkedLPA: string;
	/** Label of the call-to-action button; `null` hides it when the relevant stage is not ready to start */
	button: string | null;
	/** Shows the "action required" banner (status is Action needed) */
	notificationBanner: boolean;
	backLinkUrl: string;
	backLinkText: string;
	/** Target of the call-to-action button */
	currentApplicationLink: string;
	/** Gateway dates as supplied by the plan, displayed in the task list hints */
	dateG1: string;
	dateG2: string;
	dateG3: string;
	dateE: string;
	/** Prefix for each task list date hint, e.g. `Target date: `, `Submitted: `, `Completed: ` */
	dateTextG2: string;
	dateTextG3: string;
	dateTextE: string;
	/** Task list status per stage: status tag HTML, `Completed` or `Cannot start yet` */
	tagG2: string;
	tagG3: string;
	tagE: string;
	/** Task list link per stage; `null` when the stage cannot be opened yet */
	hrefG2: string | null;
	hrefG3: string | null;
	hrefE: string | null;
}

function examinationStatusTag(plan: Plan) {
	const classes = getExaminationStatusTagClass(plan.examinationStatus);
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
		const examinationBase = `/manage-local-plans/${encodedPlanRef}/examination`;
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
		let tagG2: string, tagG3: string, tagE: string;
		let dateTextG2: string, dateTextG3: string, dateTextE: string;
		let hrefG2: string | null, hrefG3: string | null, hrefE: string | null;
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
					if (
						plan.examinationStatus === EXAMINATION_STATUS_ID.SUBMITTED ||
						plan.examinationStatus === EXAMINATION_STATUS_ID.IN_EXAMINATION
					) {
						dateTextE = 'Submitted: ';
					}
					tagE = examinationAvailable ? examinationStatusTag(plan) : 'Cannot start yet';
					tagG2 = tagG3 = 'Completed';
				}
				break;
		}

		const viewModel = {
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
		} satisfies PlanPageViewModel;

		return res.render('views/plan-page/view.njk', viewModel);
	};
}
