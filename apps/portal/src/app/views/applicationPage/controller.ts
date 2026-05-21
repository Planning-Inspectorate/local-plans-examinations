import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { Plan, DocType, StageType } from '../../types.ts';
import { StageLabel, docTitleLabel, DocStateLabel, DocTypeLabel, DocStateTag } from '../../types.ts';
import fs from 'node:fs'; //added assume ok?

//const docListTemplate =

export function buildApplicationPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		//logic for finding correct plan
		const rawPlanRef = String(req.params['refNum']);
		const stageNum = Number(req.params['stage']);
		console.log(req.params['stage']);
		const stage = StageLabel[stageNum as StageType];
		const planRef = rawPlanRef.replace('-', '/');
		const rawPlans = JSON.parse(fs.readFileSync('src/app/testData.json', 'utf-8'));
		//console.log([rawPlanRef, stage])
		//console.log(String(req.params["refNum"]).split("!"))

		//checks if plan exists logs error if fail
		const plan = (rawPlans as Plan[]).find((p) => p.refNum === planRef);
		//const plan = "4567"
		if (!plan) {
			logger.warn({ planRef }, 'Plan not found');
			res.status(404).send('Plan not found');
			return;
		}

		const pageTitle = stage + ' application';
		const targetDate = plan.dates.split('|')[Number(stageNum)];

		//values for generating DocsStructured
		const doctypesForG2: DocType[] = [0, 1, 2];
		const DocsStructured: any[] = [];
		let count = 1;

		//itterates over each doctype given pushes to a array to be fed to njk
		//contains logic for display
		for (const doctype of doctypesForG2) {
			const filteredDoctype = plan.documents.filter((doc) => doc.type === doctype);
			DocsStructured.push({
				heading: String(count) + '. ' + DocTypeLabel[doctype],
				tag: DocStateTag[plan.sections[doctype]],
				rows: filteredDoctype.map((doc) => ({
					key: {
						//doc title
						text: docTitleLabel[doc.title]
					},
					value: {
						//state display
						html:
							doc.state === 2 && doc.dateCompleted
								? `<span class="govuk-caption-m">${DocStateLabel[doc.state]} ${doc.dateCompleted}</span>`
								: `<span class="govuk-caption-m">${DocStateLabel[doc.state]}</span>`
					},
					actions: {
						//actions, links
						items: [
							{
								href: `/fileUpload/${doc.title}`,
								text: 'Add',
								visuallyHiddenText: docTitleLabel[doc.title]
							}
						]
					}
				}))
			});
			count++;
		}

		const viewModel = {
			DocsStructured,
			visitCount: req.session.visits
		};

		return res.render('views/applicationPage/view.njk', {
			pageCaption: planRef,
			pageTitle,
			targetDate,
			planTitle: plan.title,
			leadLPA: plan.leadLPA,
			linkedLPA: plan.linkedLPA,
			backLinkUrl: '/planPage/' + rawPlanRef,
			backLinkText: 'Back',
			...viewModel
		});
	};
}
