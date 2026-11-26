import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';

const guidanceLinks = {
	proceduralGuide:
		'https://www.gov.uk/guidance/procedural-guide-for-examinations-and-gateways-under-the-town-and-country-planning-local-planning-england-regulations-2026',
	createOrUpdate: 'https://www.gov.uk/government/collections/create-or-update-a-local-plan-using-the-new-system',
	gateway2: 'https://www.gov.uk/guidance/gateway-2-assessment-for-local-plans-what-you-need-to-do',
	gateway3: 'https://www.gov.uk/guidance/gateway-3-for-local-plans-what-you-need-to-do',
	regulations: 'https://www.legislation.gov.uk/uksi/2026/186/contents/made',
	localPlanProcess: 'https://www.gov.uk/guidance/30-month-local-plan-process-an-overview'
};

export function buildGuidancePage(): AsyncRequestHandler {
	return async (req, res) => {
		return res.render('views/home/guidance.njk', {
			pageTitle: 'Guidance page',
			guidanceLinks
		});
	};
}
