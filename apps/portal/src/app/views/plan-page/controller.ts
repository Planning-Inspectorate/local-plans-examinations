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

function examinationStatusTag(plan: Plan) {
	const classes = getExaminationStatusTagClass(plan.examinationStatus);
	return classes ? `<strong class="${classes}">${plan.examinationStatusLabel}</strong>` : plan.examinationStatusLabel;
}

export function buildPlanPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		const email = req.session?.authenticatedEmail;
		if (!email) {
			return res.redirect('/login');
		}
		const planRef = String(req.params.refNum);
		const rawPlans = await service.getPlans(email);
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
		// Once Gateway 3 has more than one submission, the resubmission page shows
		// the editable view (resubmission required) or the read-only view
		// (under review / complete), including all previous reports and submissions.
		const hasGateway3Resubmission = (plan.gateway3SubmissionCount ?? 0) > 1;
		const useGateway3ResubmissionPage = isResubmissionRequired || hasGateway3Resubmission;
		const currentApplicationLink =
			plan.stage === STAGE.Examination
				? examinationBase
				: plan.stage === STAGE.Gateway3 && useGateway3ResubmissionPage
					? gateway3ResubBase
					: plan.stage === STAGE.Gateway3
						? gateway3Base
						: `/manage-local-plans/${encodedPlanRef}/gateway-2/declaration`;
		const applicationLink = () => applicationBase;
		const gateway3Link = () => (useGateway3ResubmissionPage ? gateway3ResubBase : gateway3Base);
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

		const submissionExpected = 'Submission expected: ';
		// Task list tags and links based on current stage.
		let tagG2, tagG3, tagE;
		let hrefG2, hrefG3, hrefE;
		hrefG2 = hrefG3 = hrefE = null;
		tagG2 = tagG3 = tagE = 'Cannot start yet';
		let dateTextG2 = submissionExpected;
		let dateTextG3 = submissionExpected;
		let dateTextE = submissionExpected;
		let dateG2 = plan.dates.G2;
		let dateG3 = plan.dates.G3;
		let dateE = plan.dates.E;
		switch (plan.stage) {
			case STAGE.Gateway2:
				hrefG2 = applicationLink();
				tagG2 = planStatus;
				if (plan.submittedDates.G2) {
					dateTextG2 = 'Submitted: ';
					dateG2 = plan.submittedDates.G2;
				}
				break;
			case STAGE.Gateway3:
				hrefG2 = applicationLink();
				hrefG3 = gateway3Link();
				tagG2 = 'Completed';
				tagG3 = planStatus;
				if (plan.completedDates.G2) {
					dateTextG2 = 'Completed: ';
					dateG2 = plan.completedDates.G2;
				}
				if (plan.submittedDates.G3) {
					dateTextG3 = 'Submitted: ';
					dateG3 = plan.submittedDates.G3;
				}
				break;
			case STAGE.Examination:
				hrefG2 = applicationLink();
				hrefG3 = gateway3Link();
				hrefE = examinationAvailable ? examinationLink() : null;
				tagG2 = tagG3 = 'Completed';
				if (plan.completedDates.G2) {
					dateTextG2 = 'Completed: ';
					dateG2 = plan.completedDates.G2;
				}
				if (plan.completedDates.G3) {
					dateTextG3 = 'Completed: ';
					dateG3 = plan.completedDates.G3;
				}
				if (plan.status === STATUS.Completed) {
					tagE = 'Completed';
				} else {
					if (plan.examinationStatus === EXAMINATION_STATUS_ID.REPORT_ISSUED) {
						dateTextE = 'Report issued: ';
					}
					tagE = examinationAvailable ? examinationStatusTag(plan) : 'Cannot start yet';
				}
				if (plan.examinationStatus === EXAMINATION_STATUS_ID.PLAN_ADOPTED) {
					dateTextE = 'Adopted: ';
					tagE = examinationStatusTag(plan);
				} else if (plan.submittedDates.E && plan.examinationStatus !== EXAMINATION_STATUS_ID.REPORT_ISSUED) {
					dateTextE = 'Submitted: ';
					dateE = plan.submittedDates.E;
				}
				break;
		}

		const planLPAs = plan.lpaNames ?? [];
		const lpaText = planLPAs.length > 1 ? 'Joint local planning authorities' : 'Local planning authority';

		const viewModel = {
			dateG1: plan.dates.G1,
			dateG2,
			dateG3,
			dateE,
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
			planRef,
			pageTitle: plan.title,
			currentStage,
			planStatus,
			status: plan.status,
			lpaText,
			planLPAs,
			button,
			notificationBanner,
			backLinkUrl: '/manage-local-plans/your-plans',
			backLinkText: 'Back to my plans',
			currentApplicationLink,
			...viewModel
		});
	};
}
