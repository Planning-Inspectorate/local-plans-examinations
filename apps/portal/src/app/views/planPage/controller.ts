import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import fs from 'node:fs'; //added assume ok?
import { StageLabel, StatusColour } from '../../types.ts';
import type { Plan, StatusType } from '../../types.ts';

//takes status and mapping of label and class returns tags
function statusTag(status: StatusType, tagMap: typeof StatusColour) {
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
		const rawPlans = JSON.parse(fs.readFileSync('src/app/testData.json', 'utf-8'));

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
			tabTextE
		};

		return res.render('views/planPage/view.njk', {
			pageCaption: planRef,
			pageTitle: plan.title,
			currentStage: currentStage,
			status: planTag,
			leadLPA: plan.leadLPA,
			linkedLPA: plan.linkedLPA,
			button,
			notificationBanner,
			backLinkUrl: '/landingPage',
			backLinkText: 'Back to my plans',

			...viewModel
		});
	};
}
