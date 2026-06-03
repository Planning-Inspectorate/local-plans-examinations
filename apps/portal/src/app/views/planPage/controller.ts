import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { StageLabel, StatusTag, validPlan, buildTestPlans } from '../../types.ts';
import type { Plan, StatusType } from '../../types.ts';

//takes status and mapping of label and class returns tags
function statusTag(status: StatusType, tagMap: typeof StatusTag) {
	const s = tagMap?.[status];
	return `<strong class=" ${s?.class ?? ''}">
        ${s?.label ?? 'Unknown'}
    </strong>`;
}

//templates for for tabs
const tabTextG2 = `
    <p class="govuk-body">
        Gateway 2 is an advisory check. An assessor reviews your plan and provides observations to help resolve potential soundness issues early and progress towards meeting the prescribed requirements.
    </p>
    <p class="govuk-heading-s">
        What you need for gateway 2
    </p>
    <ul class="govuk-list govuk-list--bullet">
        <li>Gateway 2 covering letter</li>
        <li>Local plan timetable</li>
        <li>Project initiation document (PID)</li>
        <li>Statement of Compliance (draft)</li>
        <li>Statement of Soundness (draft)</li>
        <li>Notice of Intention to commence preparation of your local plan</li>
        <li>Scoping consultation documents</li>
        <li>Consultation summary of feedback to scoping consultation</li>
        <li>Gateway 1 - Self Assessment of Readiness</li>
        <li>Consultation on proposed local plan content and evidence documents</li>
        <li>Consultation summary responses for proposed local plan content and evidence documents</li>
    </ul>
`;

const tabTextG3 = `
    <p class="govuk-body">
        Gateway 3 tests whether your proposed local plan has met the prescribed requirements and is ready to proceed to examination.
    </p>
    <p class="govuk-body">
        Available after Gateway 2 is approved.
    </p>
    <p class="govuk-heading-s">
        What you need for gateway 3
    </p>
    <ul class="govuk-list govuk-list--bullet">
        <li>Submission version of the plan</li>
        <li>Final compliance statement</li>
        <li>Final soundness statement</li>
        <li>Updated evidence base</li>
    </ul>
`;

const tabTextE = `
    <p class="govuk-body">
        Examination is carried out by an independent inspector who assesses the plan against the tests of soundness set out in national policy.
    </p>
    <p class="govuk-body">
        Available after Gateway 3 is approved.
    </p>
`;

export function buildPlanPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		//logic for finding correct plag
		const planRef = String(req.params['refNum']).replace('-', '/');
		const rawPlans = buildTestPlans();

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
		if (plan.status == 0) {
			//Ready to start
			button = 'Start ' + currentStage + ' submission';
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
				if (plan.status == 5) {
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
			dateG1: dates[0],
			dateG2: dates[1],
			dateG3: dates[2],
			dateE: dates[3],
			dateTextG2,
			dateTextG3,
			dateTextE,
			tagG2,
			tagG3,
			tagE,
			tabTextG2,
			tabTextG3,
			tabTextE,
			hrefG2,
			hrefG3,
			hrefE
		};

		return res.render('views/planPage/view.njk', {
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
