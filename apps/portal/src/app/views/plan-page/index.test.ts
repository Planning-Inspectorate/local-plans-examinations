// @ts-nocheck
import { mockLogger } from '@planning-inspectorate/core/testing';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildPlanPage } from './controller.ts';
const READY_TO_START_TAG = '<strong class="govuk-tag govuk-tag--green">Ready to start</strong>';
const UNDER_REVIEW_TAG = '<strong class="govuk-tag govuk-tag--yellow">Under review</strong>';
/**
 * Build a Prisma-shaped `case` record (as returned by db.case.findUnique with the
 * lpas / gateway2Info / gateway3Info relations included).
 */
function mockCase(overrides = {}) {
	return {
		reference: 'PLAN-001',
		planTitle: 'East Borough Local Plan',
		gateway1Date: new Date('2026-05-07'),
		gateway2Date: new Date('2026-07-21'),
		gateway3Date: new Date('2026-08-01'),
		submissionDate: null,
		lpas: [{ lpaName: 'Southampton City Council' }, { lpaName: 'Romsey Town Council' }],
		gateway2Info: null,
		gateway3Info: null,
		...overrides
	};
}
function cleanHtml(html) {
	return html
		.replace(/\s+/g, ' ')
		.replace(/>\s+</g, '><')
		.replace(/>\s+([^<]+)\s+</g, '>$1<')
		.trim();
}
function initialiseTest(planReference, caseData) {
	const nunjucks = configureNunjucks();
	const mockRes = {
		render: mock.fn((view, data) => nunjucks.render(view, data)),
		status: mock.fn(function () {
			return mockRes;
		}),
		send: mock.fn()
	};
	const mockReq = { session: {}, params: { planReference } };
	const logger = mockLogger();
	const resolved = caseData === undefined ? mockCase({ reference: planReference }) : caseData;
	const db = { case: { findUnique: mock.fn(async () => resolved) } };
	const mockService = { logger, db };
	const planPage = buildPlanPage(mockService);
	return { planPage, mockRes, mockReq, db, nunjucks, logger };
}
async function renderPlan(planReference, caseData) {
	const ctx = initialiseTest(planReference, caseData);
	await ctx.planPage(ctx.mockReq, ctx.mockRes);
	const [view, data] = ctx.mockRes.render.mock.calls[0].arguments;
	return {
		...ctx,
		view,
		data,
		html: ctx.nunjucks.render(view, data)
	};
}
describe('plan page', () => {
	it('should render without error', async () => {
		const { mockRes } = await renderPlan('PLAN-001');
		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments.length, 2);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/plan-page/view.njk');
	});
	it('should not render a notification banner', async () => {
		const { html } = await renderPlan('PLAN-001');
		assert.ok(!html.includes('govuk-notification-banner__heading'), 'expected no notification banner');
	});
	it('should render title and caption correctly', async () => {
		const { data, html } = await renderPlan('PLAN-001');
		const expectedTitle = 'East Borough Local Plan';
		const expectedRef = 'PLAN-001';
		assert.strictEqual(data.pageTitle, expectedTitle, `expected ${expectedTitle} but got ${data.pageTitle}`);
		assert.ok(html.includes(expectedTitle), `expected html to contain ${expectedTitle}`);
		assert.strictEqual(data.pageCaption, expectedRef, `expected ${expectedRef} but got ${data.pageCaption}`);
		assert.ok(html.includes(expectedRef), `expected html to contain ${expectedRef}`);
	});
	it('should render summary table correctly (Current stage, LPA, linked LPA)', async () => {
		const { data, html } = await renderPlan('PLAN-001');
		const expectedStage = 'Gateway 2';
		const expectedLPA = 'Southampton City Council';
		const expectedLinkLPA = 'Romsey Town Council';
		assert.strictEqual(data.currentStage, expectedStage, `expected ${expectedStage} but got ${data.currentStage}`);
		assert.ok(html.includes(expectedStage), `expected ${expectedStage}`);
		assert.strictEqual(data.leadLPA, expectedLPA, `expected ${expectedLPA} but got ${data.leadLPA}`);
		assert.ok(html.includes(expectedLPA), `expected ${expectedLPA}`);
		assert.strictEqual(data.linkedLPA, expectedLinkLPA, `expected ${expectedLinkLPA} but got ${data.linkedLPA}`);
		assert.ok(html.includes(expectedLinkLPA), `expected html to contain ${expectedLinkLPA}`);
	});
	it('should render Current status tag correctly', async () => {
		const { data, html } = await renderPlan('PLAN-001');
		assert.strictEqual(
			data.planStatus,
			READY_TO_START_TAG,
			`expected ${READY_TO_START_TAG} but got ${data.planStatus}`
		);
		assert.ok(html.includes(data.planStatus), `expected html to contain ${data.planStatus}`);
	});
	it('should render button with correct link if status == ready to start', async () => {
		const { data, html } = await renderPlan('PLAN-001');
		const expectedButton = 'Start Gateway 2 submission';
		const expectedLink = '/manage-local-plans/PLAN-001/gateway-2-submission/application-declaration';
		assert.strictEqual(data.button, expectedButton, `expected ${expectedButton} but got ${data.button}`);
		assert.strictEqual(data.currentApplicationLink, expectedLink);
		assert.ok(html.includes(`href="${expectedLink}"`), 'expected action link to point to Gateway 2 declaration');
		assert.ok(html.includes('data-cy="plan-details-action"'), 'expected action link to have a stable selector');
	});
	it('should not render button if status != ready to start (e.g. Under review)', async () => {
		const plan = mockCase({ gateway2Info: { actualDate: new Date('2026-07-21') } });
		const { data, html } = await renderPlan('PLAN-001', plan);
		assert.strictEqual(data.button, null, `expected null but got ${data.button}`);
		assert.ok(!html.includes('data-cy="plan-details-action"'), 'expected no action button');
	});
	it('should render task table headings correctly (g1, g2, g3, e)', async () => {
		const { html } = await renderPlan('PLAN-001');
		const expectedHeadings = [
			'Gateway 1 - self-assessment',
			'Gateway 2 - advisory check',
			'Gateway 3 - readiness check',
			'Examination'
		];
		for (const heading of expectedHeadings) {
			assert.ok(html.includes(heading), `expected html to contain ${heading}`);
		}
	});
	it('should render task table links correctly for case 1 (Gateway 2)', async () => {
		const { data, html } = await renderPlan('PLAN-001');
		assert.strictEqual(data.hrefG2, '/manage-local-plans/PLAN-001/gateway-2-submission');
		assert.strictEqual(data.hrefG3, null);
		assert.strictEqual(data.hrefE, null);
		const expectedHTML =
			'class="govuk-link govuk-task-list__link" href="/manage-local-plans/PLAN-001/gateway-2-submission"';
		assert.ok(html.includes(expectedHTML), `expected html to contain ${expectedHTML}`);
	});
	it('should render task tags correctly for case 1 (Gateway 2, ready to start)', async () => {
		const { data } = await renderPlan('PLAN-001');
		assert.strictEqual(data.tagG2, READY_TO_START_TAG);
		assert.strictEqual(data.tagG3, 'Cannot start yet');
		assert.strictEqual(data.tagE, 'Cannot start yet');
	});
	it('should render Under review tag and Submitted hint text for GW2 when gateway 2 is submitted', async () => {
		const plan = mockCase({ gateway2Info: { actualDate: new Date('2026-07-21') } });
		const { data, html } = await renderPlan('PLAN-001', plan);
		assert.strictEqual(data.currentStage, 'Gateway 2');
		assert.strictEqual(data.tagG2, UNDER_REVIEW_TAG, `expected ${UNDER_REVIEW_TAG} but got ${data.tagG2}`);
		assert.strictEqual(data.tagG3, 'Cannot start yet');
		assert.strictEqual(data.tagE, 'Cannot start yet');
		assert.strictEqual(data.dateTextG2, 'Submitted: ', `expected 'Submitted: ' but got ${data.dateTextG2}`);
		assert.ok(html.includes('Submitted: 21 July 2026'), 'expected html to contain Submitted hint text with date');
		assert.ok(html.includes(UNDER_REVIEW_TAG), 'expected html to contain yellow Under review tag');
	});
	it('should render task table links correctly for case 2 (Gateway 3)', async () => {
		const plan = mockCase({
			gateway2Info: { actualDate: new Date('2026-07-21'), reportIssuedDate: new Date('2026-07-25') }
		});
		const { data, html } = await renderPlan('PLAN-001', plan);
		assert.strictEqual(data.currentStage, 'Gateway 3');
		assert.strictEqual(data.hrefG2, '/manage-local-plans/PLAN-001/gateway-2-submission');
		assert.strictEqual(data.hrefG3, '/manage-local-plans/PLAN-001/gateway-3-submission');
		assert.strictEqual(data.hrefE, null);
		const expectedHTML =
			'class="govuk-link govuk-task-list__link" href="/manage-local-plans/PLAN-001/gateway-3-submission"';
		assert.ok(html.includes(expectedHTML), `expected html to contain ${expectedHTML}`);
	});
	it('should render task tags correctly for case 2 (Gateway 3, ready to start)', async () => {
		const plan = mockCase({
			gateway2Info: { actualDate: new Date('2026-07-21'), reportIssuedDate: new Date('2026-07-25') }
		});
		const { data } = await renderPlan('PLAN-001', plan);
		assert.strictEqual(data.tagG2, 'Completed');
		assert.strictEqual(data.tagG3, READY_TO_START_TAG);
		assert.strictEqual(data.tagE, 'Cannot start yet');
	});
	it('should render task table links correctly for case 3 (Examination)', async () => {
		const plan = mockCase({ gateway3Info: { completionDate: new Date('2026-08-05') } });
		const { data } = await renderPlan('PLAN-001', plan);
		assert.strictEqual(data.currentStage, 'Examination');
		assert.strictEqual(data.hrefG2, '/manage-local-plans/PLAN-001/gateway-2-submission');
		assert.strictEqual(data.hrefG3, '/manage-local-plans/PLAN-001/gateway-3-submission');
		assert.strictEqual(data.hrefE, '/manage-local-plans/PLAN-001/gateway-2-submission');
	});
	it('should render task tags correctly for case 3 (Examination, ready to start)', async () => {
		const plan = mockCase({ gateway3Info: { completionDate: new Date('2026-08-05') } });
		const { data } = await renderPlan('PLAN-001', plan);
		assert.strictEqual(data.tagG2, 'Completed');
		assert.strictEqual(data.tagG3, 'Completed');
		assert.strictEqual(data.tagE, READY_TO_START_TAG);
	});
	it('should render task tags correctly for case 3 (Examination, completed)', async () => {
		const plan = mockCase({
			gateway3Info: { completionDate: new Date('2026-08-05') },
			submissionDate: new Date('2026-09-01')
		});
		const { data } = await renderPlan('PLAN-001', plan);
		assert.strictEqual(data.tagG2, 'Completed');
		assert.strictEqual(data.tagG3, 'Completed');
		assert.strictEqual(data.tagE, 'Completed');
	});
	it('should render tab headings correctly', async () => {
		const { html } = await renderPlan('PLAN-001');
		const expectedTabTitle = [
			'<a class="govuk-tabs__tab" href="#gateway-2">Gateway 2</a>',
			'<a class="govuk-tabs__tab" href="#gateway-3">Gateway 3</a>',
			'<a class="govuk-tabs__tab" href="#examination">Examination</a>'
		];
		for (const tabTitle of expectedTabTitle) {
			assert.ok(cleanHtml(html).includes(cleanHtml(tabTitle)), `expected html to contain ${tabTitle}`);
		}
	});
	it('should return 404 when plan is not found', async () => {
		const { planPage, mockRes, mockReq, logger } = initialiseTest('PLAN-999', null);
		await planPage(mockReq, mockRes);
		assert.strictEqual(logger.warn.mock.callCount(), 1);
		assert.deepStrictEqual(logger.warn.mock.calls[0].arguments, [{ planReference: 'PLAN-999' }, 'Plan not found']);
		assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 404);
		assert.strictEqual(mockRes.send.mock.calls[0].arguments[0], 'Plan not found');
		assert.strictEqual(mockRes.render.mock.callCount(), 0);
	});
	it('should return 500 when the database throws', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data)),
			status: mock.fn(function () {
				return mockRes;
			}),
			send: mock.fn()
		};
		const mockReq = { session: {}, params: { planReference: 'PLAN-001' } };
		const logger = mockLogger();
		const db = {
			case: {
				findUnique: mock.fn(async () => {
					throw new Error('db failure');
				})
			}
		};
		const planPage = buildPlanPage({ logger, db });
		await planPage(mockReq, mockRes);
		assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 500);
		assert.strictEqual(mockRes.send.mock.calls[0].arguments[0], 'Internal Server Error');
		assert.strictEqual(mockRes.render.mock.callCount(), 0);
	});
});
