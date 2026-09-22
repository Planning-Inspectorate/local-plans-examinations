import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import { getCaseStatusHTMLTag, getStageLabel } from '../landing-page/controller.ts';

export function buildPlanPage(service: PortalService): AsyncRequestHandler {
	const { logger, db } = service;
	return async (req, res) => {
		const planReference = String(req.params.planReference);
		let caseData;
		try {
			caseData = await db.case.findUnique({
				where: { reference: planReference },
				include: {
					gateway2Info: true,
					gateway3Info: true,
					lpas: { orderBy: { lpaName: 'asc' } }
				}
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
		const currentStageTag = getStageLabel(caseData);
		const planStatus = getCaseStatusHTMLTag(caseData);
		//TODO calculate the lead LPA from the list of LPAs, for now we are using the first one
		const leadLPA = caseData.lpas[0].lpaName;
		const linkedLPAs = caseData.lpas
			.slice(1)
			.map((lpa) => lpa.lpaName)
			.join(', ');

		// Task list tags and links based on current stage
		let tagG2, tagG3, tagE;
		let dateTextG2, dateTextG3, dateTextE;
		let hrefG2, hrefG3, hrefE;
		hrefG2 = hrefG3 = hrefE = null;
		tagG2 = tagG3 = tagE = 'Cannot start yet';
		dateTextG2 = dateTextG3 = dateTextE = 'Target date: ';

		const applicationLink = `/manage-local-plans/${encodeURIComponent(planReference)}/gateway-2-submission`;
		const gateway3Link = `/manage-local-plans/${encodeURIComponent(planReference)}/gateway-3-submission`;

		switch (currentStageTag) {
			case 'Gateway 2':
				hrefG2 = applicationLink;
				tagG2 = planStatus;
				if (caseData.gateway2Info?.actualDate) {
					dateTextG2 = 'Submitted: ';
				}
				break;

			case 'Gateway 3':
				dateTextG2 = 'Completed on: ';
				hrefG2 = applicationLink;
				hrefG3 = gateway3Link;
				tagG2 = 'Completed';
				tagG3 = planStatus;
				break;

			case 'Examination': {
				hrefG2 = applicationLink;
				hrefG3 = gateway3Link;
				hrefE = applicationLink;
				const isCompleted = Boolean(caseData.submissionDate);
				if (isCompleted) {
					dateTextG2 = dateTextG3 = dateTextE = 'Completed on: ';
					tagG2 = tagG3 = tagE = 'Completed';
				} else {
					dateTextG2 = dateTextG3 = 'Completed on: ';
					tagE = planStatus;
					tagG2 = tagG3 = 'Completed';
				}
				break;
			}
		}

		const viewModel = {
			dateG1: caseData.gateway1Date,
			dateG2: caseData.gateway2Date,
			dateG3: caseData.gateway3Date,
			dateE: caseData.submissionDate,
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
			pageCaption: planReference,
			pageTitle: caseData.planTitle,
			currentStage: currentStageTag,
			planStatus,
			leadLPA,
			linkedLPA: linkedLPAs,
			backLinkUrl: '/manage-local-plans/your-plans',
			backLinkText: 'Back to my plans',
			...viewModel
		});
	};
}
