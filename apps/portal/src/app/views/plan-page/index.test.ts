// @ts-nocheck

import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildPlanPage } from './controller.ts';
import {
	StatusTag,
	buildPlans,
	buildPlan,
	buildTestPlans,
	STATUS,
	STAGE,
	StatusLabel,
	StageLabel
} from '../../types.ts';

function initialiseTest(params: { refNum: string }, plan?: unknown) {
	const nunjucks = configureNunjucks();
	const mockRes = {
		render: mock.fn((view, data) => nunjucks.render(view, data)),
		status: mock.fn(function (code) {
			return mockRes;
		}),
		send: mock.fn()
	};
	const mockReq = { session: {}, params };
	const logger = mockLogger();
	const mockService = {
		logger,
		getPlans: mock.fn(async () => (plan ? [buildPlan(plan)] : buildTestPlans()))
	};
	const planPage = buildPlanPage(mockService);
	return { planPage, mockRes, mockReq, nunjucks, logger };
}

async function renderPlan(params: { refNum: string }, plan?: unknown) {
	const ctx = initialiseTest(params, plan);
	await ctx.planPage(ctx.mockReq, ctx.mockRes);
	const [view, data] = ctx.mockRes.render.mock.calls[0].arguments;
	return {
		...ctx,
		view,
		data,
		html: ctx.nunjucks.render(view, data)
	};
}

function cleanHtml(html: string) {
	return html
		.replace(/\s+/g, ' ')
		.replace(/>\s+</g, '><')
		.replace(/>\s+([^<]+)\s+</g, '>$1<')
		.trim();
}

function statusTag(status: Status) {
	const s = StatusTag[status as keyof typeof StatusTag];
	return s ? (s.class ? `<strong class="${s.class}">${s.label}</strong>` : s.label) : '';
}

describe('plan page', () => {
	it('should render without error', async () => {
		const { mockRes } = await renderPlan({ refNum: 'PLAN-001' });

		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments.length, 2);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/plan-page/view.njk');
	});

	it('should render notification banner if state = action needed', async () => {
		const plan = {
			refNum: 'PLAN/004',
			stage: STAGE.Gateway2,
			status: STATUS.ActionNeeded,
			dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
		};
		const { data, html } = await renderPlan({ refNum: 'PLAN-004' }, plan);

		const expectedBanClass = 'class="govuk-notification-banner__heading"';
		const expectedBanHeading = 'Action needed: Gateway 2 submission incomplete';

		assert.strictEqual(data.notificationBanner, true);
		assert.ok(html.includes(expectedBanClass), `expected html to contain ${expectedBanClass}`);
		assert.ok(html.includes(expectedBanHeading), `expected html to contain ${expectedBanHeading}`);
	});

	describe('should not render notification banner if not state = action needed', () => {
		const testCases = [
			{
				refNum: 'PLAN-001',
				plan: {
					refNum: 'PLAN/001',
					stage: STAGE.Gateway2,
					status: STATUS.ReadyToStart,
					dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
				}
			},
			{
				refNum: 'PLAN-002',
				plan: {
					refNum: 'PLAN/002',
					stage: STAGE.Gateway2,
					status: STATUS.InProgress,
					dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
				}
			},
			{
				refNum: 'PLAN-003',
				plan: {
					refNum: 'PLAN/003',
					stage: STAGE.Gateway3,
					status: STATUS.WithPINS,
					dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
				}
			},
			{
				refNum: 'PLAN-005',
				plan: {
					refNum: 'PLAN/005',
					stage: STAGE.Examination,
					status: STATUS.Invalid,
					dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
				}
			},
			{
				refNum: 'PLAN-006',
				plan: {
					refNum: 'PLAN/006',
					stage: STAGE.Examination,
					status: STATUS.Completed,
					dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
				}
			}
		];

		for (const { refNum, plan } of testCases) {
			it(`status ${StatusLabel[plan.status]} at stage ${StageLabel[plan.stage]}`, async () => {
				const { data, html } = await renderPlan({ refNum }, plan);

				const expectedBanClass = 'class="govuk-notification-banner__heading"';
				const expectedBanHeading = 'Action needed: Gateway 2 submission incomplete';

				assert.strictEqual(data.notificationBanner, false);
				assert.ok(!html.includes(expectedBanClass), `expected html not to contain ${expectedBanClass}`);
				assert.ok(!html.includes(expectedBanHeading), `expected html not to contain ${expectedBanHeading}`);
			});
		}
	});

	it('should render title and caption correctly', async () => {
		const { data, html } = await renderPlan({ refNum: 'PLAN-001' });

		const expectedTitle = 'East Borough Local Plan';
		const expectedRef = 'PLAN/001';

		assert.strictEqual(data.pageTitle, expectedTitle, `expected ${expectedTitle} but got ${data.pageTitle}`);
		assert.ok(html.includes(expectedTitle), `expected html to contain ${expectedTitle}`);
		assert.strictEqual(data.pageCaption, expectedRef, `expected ${expectedRef} but got ${data.pageCaption}`);
		assert.ok(html.includes(expectedRef), `expected html to contain ${expectedRef}`);
	});

	it('should render summary table correctly (Current stage, LPA, linked LPA)', async () => {
		const { data, html } = await renderPlan({ refNum: 'PLAN-001' });

		const expectedStage = 'Gateway 2';
		const expectedLPA = 'Southampton City Council';
		const expectedLinkLPA = 'Romsey Town Council';

		assert.strictEqual(data.currentStage, expectedStage, `expected ${expectedStage} but got ${data.currentStage}`);
		assert.ok(html.includes('Gateway 2'), `expected ${expectedStage}`);
		assert.strictEqual(data.leadLPA, expectedLPA, `expected ${expectedLPA} but got ${data.leadLPA}`);
		assert.ok(html.includes(expectedLPA), `expected ${expectedLPA}`);
		assert.strictEqual(data.linkedLPA, expectedLinkLPA, `expected ${expectedLinkLPA} but got ${data.linkedLPA}`);
		assert.ok(html.includes(expectedLinkLPA), `expected html to contain ${expectedLinkLPA}`);
	});

	it('should render Current status tag correctly', async () => {
		const { data, html } = await renderPlan({ refNum: 'PLAN-001' });

		const expectedTags = [
			'<strong class="govuk-tag govuk-tag--green">Ready to start</strong>',
			'<strong class="govuk-tag govuk-tag--blue">In progress</strong>',
			'<strong class="govuk-tag govuk-tag--yellow">With PINS</strong>',
			'<strong class="govuk-tag govuk-tag--red">Action needed</strong>',
			'<strong class="govuk-tag govuk-tag--grey">Invalid</strong>',
			'Completed'
		];

		assert.ok(expectedTags.includes(data.planStatus), `Expected one of ${expectedTags} but got ${data.planStatus}`);
		assert.ok(html.includes(data.planStatus), `expected html to contain ${data.planStatus}`);
	});

	it('should render button with correct link if status == ready to start', async () => {
		const { data, html } = await renderPlan({ refNum: 'PLAN-001' });

		const expectedButton = 'Start Gateway 2 submission';
		const expectedHTML = `<a href="/applicationPage/PLAN-001/1" class="govuk-button">`;

		assert.strictEqual(data.button, expectedButton, `expected ${expectedButton} but got ${data.button}`);
		assert.ok(html.trim().includes(expectedHTML), `expected html to contain ${expectedHTML}`);
	});

	describe('should not render button if status != ready to start', () => {
		const testCases = [
			{ refNum: 'PLAN-002', status: STATUS.InProgress },
			{ refNum: 'PLAN-003', status: STATUS.WithPINS },
			{ refNum: 'PLAN-004', status: STATUS.ActionNeeded },
			{ refNum: 'PLAN-005', status: STATUS.Invalid },
			{ refNum: 'PLAN-006', status: STATUS.Completed }
		];

		for (const { refNum, status } of testCases) {
			it(`status ${StatusLabel[status]}`, async () => {
				const { data, html } = await renderPlan({ refNum });

				const expectedHTML = `<a href="/applicationPage/${refNum}/1" class="govuk-button">`;

				assert.strictEqual(data.button, null, `expected null but got ${data.button}`);
				assert.ok(!html.includes(expectedHTML), `expected html not to contain ${expectedHTML}`);
			});
		}
	});

	it('should render task table headings correctly (g1, g2, g3, e)', async () => {
		const { html } = await renderPlan({ refNum: 'PLAN-001' });

		const expectedHeadings = [
			'Gateway 1 - self-assessment',
			'Gateway 2 - advisory check',
			'Gateway 3 - readiness check',
			'Examination'
		];

		for (const heading of expectedHeadings) {
			assert.ok(html.trim().includes(heading), `expected html to contain ${heading}`);
		}
	});

	it('should render task table links correctly for case 1 (G1 complete)', async () => {
		const { data, html } = await renderPlan({ refNum: 'PLAN-001' });

		const expectedLinks = ['/applicationPage/PLAN-001/1', null, null];
		const links = [data.hrefG2, data.hrefG3, data.hrefE];
		const expectedHTML = 'class="govuk-link govuk-task-list__link" href="/applicationPage/PLAN-001/1"';

		for (let i = 0; i < expectedLinks.length; i++) {
			assert.strictEqual(expectedLinks[i], links[i], `expected ${expectedLinks[i]} but got ${links[i]}`);
		}

		assert.ok(html.includes(expectedHTML), `expected html to contain ${expectedHTML}`);
	});

	it('should render task tag correctly for case 1 (G1 complete)', async () => {
		const { data, html } = await renderPlan({ refNum: 'PLAN-001' });

		const expectedTags = [
			'<strong class="govuk-tag govuk-tag--green">Ready to start</strong>',
			'Cannot start yet',
			'Cannot start yet'
		];
		const tags = [data.tagG2, data.tagG3, data.tagE];
		const expectedHTML =
			'<div class="govuk-task-list__status" id="task-list-2-status"><strong class="govuk-tag govuk-tag--green">Ready to start</strong></div>';

		for (let i = 0; i < expectedTags.length; i++) {
			assert.deepStrictEqual(tags[i], expectedTags[i], `expected ${expectedTags[i]} but got ${tags[i]}`);
		}

		assert.ok(cleanHtml(html).includes(cleanHtml(expectedHTML)), `expected html to contain ${expectedHTML}`);
	});

	describe('should render task tag correctly for case 1 (G1 complete) if status != 0', () => {
		const testCases = [
			{ refNum: 'PLAN-002', status: STATUS.InProgress },
			{ refNum: 'PLAN-003', status: STATUS.WithPINS },
			{ refNum: 'PLAN-004', status: STATUS.ActionNeeded },
			{ refNum: 'PLAN-005', status: STATUS.Invalid },
			{ refNum: 'PLAN-006', status: STATUS.Completed }
		];

		for (const { refNum, status } of testCases) {
			it(`status ${StatusLabel[status]}`, async () => {
				const plan = {
					refNum: refNum.replace('PLAN-', 'PLAN/'),
					stage: STAGE.Gateway2,
					status,
					dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
				};
				const { data } = await renderPlan({ refNum }, plan);

				const expectedTags = [statusTag(status), 'Cannot start yet', 'Cannot start yet'];
				const tags = [data.tagG2, data.tagG3, data.tagE];

				for (let j = 0; j < expectedTags.length; j++) {
					assert.deepStrictEqual(expectedTags[j], tags[j], `expected ${expectedTags[j]} but got ${tags[j]}`);
				}
			});
		}
	});

	it('should render task table links correctly for case 2 (G1, G2 complete)', async () => {
		const plan = {
			refNum: 'PLAN/001',
			stage: STAGE.Gateway3,
			status: STATUS.ReadyToStart,
			dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
		};
		const { data, html } = await renderPlan({ refNum: 'PLAN-001' }, plan);

		const expectedLinks = ['/applicationPage/PLAN-001/1', `/applicationPage/PLAN-001/2`, null];
		const links = [data.hrefG2, data.hrefG3, data.hrefE];
		const expectedHTML = 'class="govuk-link govuk-task-list__link" href="/applicationPage/PLAN-001/2"';

		for (let i = 0; i < expectedLinks.length; i++) {
			assert.strictEqual(expectedLinks[i], links[i], `expected ${expectedLinks[i]} but got ${links[i]}`);
		}

		assert.ok(html.includes(expectedHTML), `expected html to contain ${expectedHTML}`);
	});

	it('should render task tag correctly for case 2 (G1, G2 complete)', async () => {
		const plan = {
			refNum: 'PLAN/001',
			stage: STAGE.Gateway3,
			status: STATUS.ReadyToStart,
			dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
		};
		const { data, html } = await renderPlan({ refNum: 'PLAN-001' }, plan);

		const expectedTags = [
			'Completed',
			'<strong class="govuk-tag govuk-tag--green">Ready to start</strong>',
			'Cannot start yet'
		];
		const tags = [data.tagG2, data.tagG3, data.tagE];
		const expectedHTML = `<div class="govuk-task-list__status" id="task-list-3-status"><strong class="govuk-tag govuk-tag--green">Ready to start</strong></div>`;

		for (let i = 0; i < expectedTags.length; i++) {
			assert.deepStrictEqual(tags[i], expectedTags[i], `expected ${expectedTags[i]} but got ${tags[i]}`);
		}

		assert.ok(cleanHtml(html).includes(cleanHtml(expectedHTML)), `expected html to contain ${expectedHTML}`);
	});

	describe('should render task tag correctly for case 2 (G1, G2 complete) if status != 0', () => {
		const testCases = [
			{ refNum: 'PLAN-002', status: STATUS.InProgress },
			{ refNum: 'PLAN-003', status: STATUS.WithPINS },
			{ refNum: 'PLAN-004', status: STATUS.ActionNeeded },
			{ refNum: 'PLAN-005', status: STATUS.Invalid },
			{ refNum: 'PLAN-006', status: STATUS.Completed }
		];

		for (const { refNum, status } of testCases) {
			it(`status ${StatusLabel[status]}`, async () => {
				const plan = {
					refNum: refNum.replace('PLAN-', 'PLAN/'),
					stage: STAGE.Gateway3,
					status,
					dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
				};
				const { data } = await renderPlan({ refNum }, plan);

				const expectedTags = ['Completed', statusTag(status), 'Cannot start yet'];
				const tags = [data.tagG2, data.tagG3, data.tagE];

				for (let j = 0; j < expectedTags.length; j++) {
					assert.deepStrictEqual(expectedTags[j], tags[j], `expected ${expectedTags[j]} but got ${tags[j]}`);
				}
			});
		}
	});

	it('should render task table links correctly for case 3 (G1, G2, G3 complete)', async () => {
		const plan = {
			refNum: 'PLAN/001',
			stage: STAGE.Examination,
			status: STATUS.ReadyToStart,
			dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
		};
		const { data, html } = await renderPlan({ refNum: 'PLAN-001' }, plan);

		const expectedLinks = ['/applicationPage/PLAN-001/1', `/applicationPage/PLAN-001/2`, `/applicationPage/PLAN-001/3`];
		const links = [data.hrefG2, data.hrefG3, data.hrefE];
		const expectedHTML = 'class="govuk-link govuk-task-list__link" href="/applicationPage/PLAN-001/3"';

		for (let i = 0; i < expectedLinks.length; i++) {
			assert.strictEqual(expectedLinks[i], links[i], `expected ${expectedLinks[i]} but got ${links[i]}`);
		}

		assert.ok(html.includes(expectedHTML), `expected html to contain ${expectedHTML}`);
	});

	it('should render task tag correctly for case 3 (G1, G2, G3 complete)', async () => {
		const plan = {
			refNum: 'PLAN/001',
			stage: STAGE.Examination,
			status: STATUS.ReadyToStart,
			dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
		};
		const { data, html } = await renderPlan({ refNum: 'PLAN-001' }, plan);

		const expectedTags = [
			'Completed',
			'Completed',
			'<strong class="govuk-tag govuk-tag--green">Ready to start</strong>'
		];
		const tags = [data.tagG2, data.tagG3, data.tagE];
		const expectedHTML = `<div class="govuk-task-list__status" id="task-list-4-status"><strong class="govuk-tag govuk-tag--green">Ready to start</strong></div>`;

		for (let i = 0; i < expectedTags.length; i++) {
			assert.deepStrictEqual(tags[i], expectedTags[i], `expected ${expectedTags[i]} but got ${tags[i]}`);
		}

		assert.ok(cleanHtml(html).includes(cleanHtml(expectedHTML)), `expected html to contain ${expectedHTML}`);
	});

	describe('should render task tag correctly for case 3 (G1, G2, G3 complete) if status != 0', () => {
		const testCases = [
			{ refNum: 'PLAN-002', status: STATUS.InProgress },
			{ refNum: 'PLAN-003', status: STATUS.WithPINS },
			{ refNum: 'PLAN-004', status: STATUS.ActionNeeded },
			{ refNum: 'PLAN-005', status: STATUS.Invalid }
		];

		for (const { refNum, status } of testCases) {
			it(`status ${StatusLabel[status]}`, async () => {
				const plan = {
					refNum: refNum.replace('PLAN-', 'PLAN/'),
					stage: STAGE.Examination,
					status,
					dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
				};
				const { data } = await renderPlan({ refNum }, plan);

				const expectedTags = ['Completed', 'Completed', statusTag(status)];
				const tags = [data.tagG2, data.tagG3, data.tagE];

				for (let j = 0; j < expectedTags.length; j++) {
					assert.deepStrictEqual(expectedTags[j], tags[j], `expected ${expectedTags[j]} but got ${tags[j]}`);
				}
			});
		}
	});

	it('should render task table links correctly for case 3 p2 (G1, G2, G3, E complete)', async () => {
		const plan = {
			refNum: 'PLAN/001',
			stage: STAGE.Examination,
			status: STATUS.Completed,
			dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
		};
		const { data, html } = await renderPlan({ refNum: 'PLAN-001' }, plan);

		const expectedLinks = ['/applicationPage/PLAN-001/1', '/applicationPage/PLAN-001/2', '/applicationPage/PLAN-001/3'];
		const links = [data.hrefG2, data.hrefG3, data.hrefE];
		const expectedHTML = 'class="govuk-link govuk-task-list__link" href="/applicationPage/PLAN-001/3"';

		for (let i = 0; i < expectedLinks.length; i++) {
			assert.strictEqual(expectedLinks[i], links[i], `expected ${expectedLinks[i]} but got ${links[i]}`);
		}

		assert.ok(html.includes(expectedHTML), `expected html to contain ${expectedHTML}`);
	});

	it('should render task tag correctly for case 3 p2 (G1, G2, G3, E complete)', async () => {
		const plan = {
			refNum: 'PLAN/001',
			stage: STAGE.Examination,
			status: STATUS.Completed,
			dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
		};
		const { data } = await renderPlan({ refNum: 'PLAN-001' }, plan);

		const expectedTags = ['Completed', 'Completed', 'Completed'];
		const tags = [data.tagG2, data.tagG3, data.tagE];

		for (let i = 0; i < expectedTags.length; i++) {
			assert.deepStrictEqual(tags[i], expectedTags[i], `expected ${expectedTags[i]} but got ${tags[i]}`);
		}
	});

	it('should render tab headings correctly', async () => {
		const { html } = await renderPlan({ refNum: 'PLAN-001' });

		const expectedTabTitle = [
			`<a class="govuk-tabs__tab" href="#gateway-2">Gateway 2</a>`,
			`<a class="govuk-tabs__tab" href="#gateway-3">Gateway 3</a>`,
			`<a class="govuk-tabs__tab" href="#examination">Examination</a>`
		];

		for (const tabTitle of expectedTabTitle) {
			assert.ok(cleanHtml(html).includes(cleanHtml(tabTitle)), `expected html to contain ${tabTitle}`);
		}
	});

	it('should return 404 when plan is not found', async () => {
		const { planPage, mockRes, mockReq, logger } = initialiseTest({ refNum: 'PLAN-999' });
		await planPage(mockReq, mockRes);

		assert.strictEqual(logger.warn.mock.callCount(), 1);
		assert.deepStrictEqual(logger.warn.mock.calls[0].arguments, [{ planRef: 'PLAN/999' }, 'Plan not found']);
		assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 404);
		assert.strictEqual(mockRes.send.mock.calls[0].arguments[0], 'Plan not found');
		assert.strictEqual(mockRes.render.mock.callCount(), 0);
	});

	it('should return 404 when plan exists but is invalid', async () => {
		const plan = {
			refNum: 'PLAN/001',
			title: 'Error Plan',
			stage: 999,
			status: 999
		};

		const { planPage, mockRes, mockReq } = initialiseTest({ refNum: 'PLAN-001' }, plan);
		await planPage(mockReq, mockRes);

		assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 404);
		assert.strictEqual(mockRes.send.mock.calls[0].arguments[0], 'Plan not found');
	});
});
