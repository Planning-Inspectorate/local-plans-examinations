import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { Plan, DocType, Stage } from '../../types.ts';
import {
	StageLabel,
	docTitleLabel,
	StateLabel,
	DocTypeLabel,
	StateTag,
	validPlan,
	stagesDocType
} from '../../types.ts';

//const docListTemplate =

export function buildApplicationPage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req, res) => {
		//logic for finding correct plan from url
		const rawPlanRef = String(req.params['refNum']);
		const planRef = rawPlanRef.replace('-', '/');
		const rawPlans = await service.getPlans();

		//checks if plan exists and is valid, logs error if fail
		const plan = (rawPlans as Plan[]).find((plan) => plan.refNum === planRef);
		if (!validPlan(plan)) {
			logger.warn({ planRef }, 'Plan not found');
			res.status(404).send('Plan not found');
			return;
		}

		const stageNum = Number(req.params['stage']);
		const stage = StageLabel[stageNum as Stage];
		const pageTitle = stage + ' application';
		const targetDate = plan.dates.split('|')[Number(stageNum)];

		const sectionCompleted = [];
		for (const DocType of stagesDocType[stageNum as Stage]!) {
			const docsOfType = plan.documents.filter((doc) => doc.type === DocType);
			sectionCompleted.push(docsOfType.every((doc) => doc.dateCompleted !== null));
		}
		const sectionTrackerTitle = sectionCompleted.every((sec) => sec === true)
			? 'Application complete'
			: 'Application incomplete';

		const sectionTrackerHint = sectionCompleted.filter((sec) => sec === true).length;

		const sectionTracker = [
			{
				title: { text: sectionTrackerTitle },
				hint: { text: 'You have completed ' + sectionTrackerHint + ' of ' + sectionCompleted.length + ' sections.' }
			}
		];
		console.log(sectionTracker, plan.documents);

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
				tag: StateTag[plan.sections[doctype]],
				rows: filteredDoctype.map((doc) => ({
					key: {
						//doc title
						text: docTitleLabel[doc.title]
					},
					value: {
						//state display
						html:
							doc.state === 2 && doc.dateCompleted
								? `<span class="govuk-caption-m">${StateLabel[doc.state]} ${doc.dateCompleted}</span>`
								: `<span class="govuk-caption-m">${StateLabel[doc.state]}</span>`
					},
					actions: {
						//actions, links
						items: [
							{
								href: `/fileUpload/${doc.title}`,
								text: 'Add'
							}
						]
					}
				}))
			});
			count++;
		}

		const viewModel = {
			sectionTracker,
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
