import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';

export function buildQuestionnairePage(service: PortalService): AsyncRequestHandler {
	const { logger } = service;

	return async (req, res) => {
		const formFields = [
			{
				type: 'text',
				name: 'fullName',
				label: 'Full name',
				required: true
			},
			{
				type: 'select',
				name: 'country',
				label: 'Country',
				options: ['UK', 'USA']
			},
			// ✅ STEP 5 — conditional field
			{
				type: 'text',
				name: 'postcode',
				label: 'Postcode',
				showIf: {
					field: 'country',
					equals: 'UK'
				}
			}
		];

		const viewModel = {
			message: 'Questionnaire 12345',
			fields: formFields
		};

		logger.info({ viewModel }, 'page78');

		return res.render('views/questionnaire/view.njk', {
			pageTitle: 'Questionnaire21',
			...viewModel
		});
	};
}
