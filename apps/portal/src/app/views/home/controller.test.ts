// @ts-nocheck

import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildGuidancePage } from './controller.ts';

const guidanceLinks = {
	proceduralGuide:
		'https://www.gov.uk/guidance/procedural-guide-for-examinations-and-gateways-under-the-town-and-country-planning-local-planning-england-regulations-2026',
	createOrUpdate: 'https://www.gov.uk/government/collections/create-or-update-a-local-plan-using-the-new-system',
	gateway2: 'https://www.gov.uk/guidance/gateway-2-assessment-for-local-plans-what-you-need-to-do',
	gateway3: 'https://www.gov.uk/guidance/gateway-3-for-local-plans-what-you-need-to-do',
	regulations: 'https://www.legislation.gov.uk/uksi/2026/186/contents/made',
	localPlanProcess: 'https://www.gov.uk/guidance/30-month-local-plan-process-an-overview'
};

const templateData = {
	config: { styleFile: 'style.css', headerTitle: '', footerLinks: [], primaryNavigationLinks: [] },
	guidanceLinks
};

describe('guidance page', () => {
	it('should render without error', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {};
		const guidancePage = buildGuidancePage();
		await assert.doesNotReject(() => guidancePage(mockReq, mockRes));
		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/home/guidance.njk');
	});

	it('renders the guidance heading and description', async () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/home/guidance.njk', templateData);
		assert.ok(html.includes('Guidance'), 'expected Guidance heading');
		assert.ok(
			html.includes('Get advice on what you need to do to successfully complete the gateway and examination process.'),
			'expected guidance description'
		);
	});

	it('renders all six guidance cards with correct links', async () => {
		const nunjucks = configureNunjucks();
		const html = nunjucks.render('views/home/guidance.njk', templateData);
		assert.ok(html.includes('Procedural guide'), 'expected Procedural guide card');
		assert.ok(html.includes('Create or update a local plan using the new system'), 'expected Create or update card');
		assert.ok(html.includes('Gateway 2 for local plans: what you need to do'), 'expected Gateway 2 card');
		assert.ok(html.includes('Gateway 3 for local plans: what you need to do'), 'expected Gateway 3 card');
		assert.ok(
			html.includes('The Town and Country Planning (Local Planning) (England) Regulations 2026'),
			'expected Regulations card'
		);
		assert.ok(html.includes('30-month local plan process: an overview'), 'expected Local plan process card');
		assert.ok(html.includes(guidanceLinks.proceduralGuide), 'expected procedural guide URL');
		assert.ok(html.includes(guidanceLinks.regulations), 'expected regulations URL');
		assert.ok(html.includes(guidanceLinks.localPlanProcess), 'expected 30-month process URL');
	});
});
