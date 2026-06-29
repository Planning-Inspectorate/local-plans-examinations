// @ts-nocheck

import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildPlanPage } from './controller.ts';
import { StatusTag, buildPlans, buildPlan, buildTestPlans } from '../../types.ts';

function initialiseTest(params: {}, plan?: unknown[]) {
	const nunjucks = configureNunjucks();
	const mockRes = {
		render: mock.fn((view, data) => nunjucks.render(view, data)),
		status: mock.fn(function (code) {
			return this;
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

function cleanHtml(html: string) {
	return html
		.replace(/\s+/g, ' ')
		.replace(/>\s+</g, '><')
		.replace(/>\s+([^<]+)\s+</g, '>$1<')
		.trim();
}

//takes status and mapping of label and class returns tags
function statusTag(status: Status, tagMap: typeof StatusTag) {
	const s = tagMap?.[status];
	return `<strong class="${s?.class ?? ''}">${s?.label ?? 'Unknown'}</strong>`;
}

describe('plan page', () => {
	it('should render without error', async () => {
		const param = { refNum: 'PLAN-001' };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments.length, 2);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/plan-page/view.njk');
	});

	it('should render notification banner if state = action needed', async () => {
		const param = { refNum: 'PLAN-004' };
		const plan = { refNum: 'PLAN/004', stage: 1, status: 3 }; //status 3 == action needed

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param, plan);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedBanClass = 'class="govuk-notification-banner__heading"';
		const expectedBanHeading = 'Action needed: Gateway 2 submission incomplete';

		assert.strictEqual(data.notificationBanner, true);

		assert.ok(html.includes(expectedBanClass), `expected html to contain ${expectedBanClass}`);
		assert.ok(html.includes(expectedBanHeading), `expected html to contain ${expectedBanHeading}`);
	});

	it('should not render notification banner if not state = action needed', async () => {
		const params = [
			{ refNum: 'PLAN-001' },
			{ refNum: 'PLAN-002' },
			{ refNum: 'PLAN-003' },
			{ refNum: 'PLAN-005' },
			{ refNum: 'PLAN-006' }
		];
		const plans = [
			{ refNum: 'PLAN/001', stage: 1, status: 0 },
			{ refNum: 'PLAN/002', stage: 1, status: 1 },
			{ refNum: 'PLAN/003', stage: 2, status: 2 },
			{ refNum: 'PLAN/005', stage: 3, status: 4 },
			{ refNum: 'PLAN/006', stage: 3, status: 5 }
		];

		for (let i = 0; i < params.length; i++) {
			const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params[i], plans[i]);
			await assert.doesNotReject(() => planPage(mockReq, mockRes));

			const [view, data] = mockRes.render.mock.calls[0].arguments;
			const html = nunjucks.render(view, data);

			const expectedBanClass = 'class="govuk-notification-banner__heading"';
			const expectedBanHeading = 'Action needed: Gateway 2 submission incomplete';

			assert.strictEqual(data.notificationBanner, null);

			assert.ok(!html.includes(expectedBanClass), `expected html not to contain ${expectedBanClass}`);
			assert.ok(!html.includes(expectedBanHeading), `expected html not to contain ${expectedBanHeading}`);
		}
	});

	it('should render title and caption correctly', async () => {
		const param = { refNum: 'PLAN-001' };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedTitle = 'East Borough Local Plan';
		const expectedRef = 'PLAN/001';

		assert.strictEqual(data.pageTitle, expectedTitle, `expected ${expectedTitle} but got ${data.pageTitle}`);
		assert.ok(html.includes(expectedTitle), `expected html to contain ${expectedTitle}`);
		assert.strictEqual(data.pageCaption, expectedRef, `expected ${expectedRef} but got ${data.pageCaption}`);
		assert.ok(html.includes(expectedRef), `expected html to contain ${expectedRef}`);
	});

	it('should render summary table correctly (Current stage, LPA, linked LPA)', async () => {
		const param = { refNum: 'PLAN-001' };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedStage = 'Gateway 2';
		const expectedLPA = 'Southampton City Council';
		const expectedLinkLPA = 'Romsey Town Council';

		assert.strictEqual(data.currentStage, expectedStage, `expected ${expectedStage} but got ${data.currentStage}`);
		assert.ok(html.includes('Gateway 2'), `expected ${expectedStage}`);
		assert.strictEqual(data.leadLPA, expectedLPA, `expected ${expectedLPA} but got ${data.leadLPA}`);
		assert.ok(html.includes(expectedLPA), `expected ${expectedLPA}`);
		assert.strictEqual(data.linkedLPA, expectedLinkLPA, `expected ${expectedLinkLPA} but got ${data.linkedLPA}`);
		assert.ok(html.includes(expectedLinkLPA, `expected ${expectedLinkLPA}`));
	});

	it('should render Current status tag correctly', async () => {
		const param = { refNum: 'PLAN-001' };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedTags = [
			{ className: 'govuk-tag govuk-tag--green', text: 'Ready to start' },
			{ className: 'govuk-tag govuk-tag--blue', text: 'In progress' },
			{ className: 'govuk-tag govuk-tag--yellow', text: 'With PINS' },
			{ className: 'govuk-tag govuk-tag--red', text: 'Action needed' },
			{ className: 'govuk-tag govuk-tag--grey', text: 'Invalid' },
			{ className: 'govuk-body', text: 'Completed' }
		];

		const rawTagClass = data.planStatusTag.match(/"([^"]+)"/)?.[1].trim();
		const rawTagText = data.planStatusTag.match(/>([^<]+)</)?.[1].trim();

		assert.ok(
			expectedTags.some((tag) => tag.className === rawTagClass && tag.text === rawTagText),
			`Expected one of ${expectedTags} but got ${rawTagClass}, ${rawTagText}`
		);
		assert.ok(
			html.includes(`<strong class="${rawTagClass}">${rawTagText}</strong>`),
			`expected <strong class="${rawTagClass}">${rawTagText}</strong>`
		);
	});

	it('should render button with correct link if status == ready to start', async () => {
		// 0 = ready to start
		const param = { refNum: 'PLAN-001' };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedButton = 'Start Gateway 2 submission';
		const expectedHTML = `<a href="/applicationPage/PLAN-001/1" class="govuk-button">`;

		assert.strictEqual(data.button, expectedButton, `expected ${expectedButton} but got ${data.button}`);
		assert.ok(html.trim().includes(expectedHTML), `expected html to contain ${expectedHTML}`);
	});

	it('should not render button if status != ready to start', async () => {
		const params = [
			{ refNum: 'PLAN-002', stage: 1, status: 1 },
			{ refNum: 'PLAN-003', stage: 1, status: 2 },
			{ refNum: 'PLAN-004', stage: 1, status: 3 },
			{ refNum: 'PLAN-005', stage: 1, status: 4 },
			{ refNum: 'PLAN-006', stage: 1, status: 5 }
		];

		for (const param of params) {
			const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
			await assert.doesNotReject(() => planPage(mockReq, mockRes));

			const [view, data] = mockRes.render.mock.calls[0].arguments;
			const html = nunjucks.render(view, data);

			const expectedHTML = `<a href="/applicationPage/` + param.refNum + `/1" class="govuk-button">`;

			assert.strictEqual(data.button, null, `expected null but got ${data.button}`);
			assert.ok(!html.includes(expectedHTML), `expected html to contain ${expectedHTML}`);
		}
	});

	it('should render task table headings correctly (g1, g2, g3, e)', async () => {
		const param = { refNum: 'PLAN-001' };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

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
		const param = { refNum: 'PLAN-001' };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedLinks = ['/applicationPage/PLAN-001/1', null, null];
		const links = [data.hrefG2, data.hrefG3, data.hrefE];
		const expectedHTML = 'class="govuk-link govuk-task-list__link" href="/applicationPage/PLAN-001/1"';

		for (let i = 0; i < expectedLinks.length; i++) {
			assert.strictEqual(expectedLinks[i], links[i], `expected ${expectedLinks[i]} but got ${links[i]}`);
		}

		assert.ok(html.includes(expectedHTML), `expected html to contain ${expectedHTML}`);
	});

	it('should render task tag correctly for case 1 (G1 complete)', async () => {
		const param = { refNum: 'PLAN-001' };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedTags = [
			'<strong class="govuk-tag govuk-tag--green">Ready to start</strong>',
			'Cannot start yet',
			'Cannot start yet'
		];
		const tags = [data.tagG2, data.tagG3, data.tagE];
		const expectedHTML =
			'<div class="govuk-task-list__status" id="task-list-2-status"><strong class="govuk-tag govuk-tag--green">Ready to start</strong></div>';

		for (let i = 0; i < expectedTags.length; i++) {
			assert.strictEqual(tags[i], expectedTags[i], `expected ${expectedTags[i]} but got ${tags[i]}`);
		}

		assert.ok(cleanHtml(html).includes(cleanHtml(expectedHTML)), `expected html to contain ${expectedHTML}`);
	});

	it('should render task tag correctly for case 1 (G1 complete) if status != 0', async () => {
		const params = [
			{ refNum: 'PLAN-002' },
			{ refNum: 'PLAN-003' },
			{ refNum: 'PLAN-004' },
			{ refNum: 'PLAN-005' },
			{ refNum: 'PLAN-006' }
		];

		const plans = [
			{ refNum: 'PLAN/002', stage: 1, status: 1 },
			{ refNum: 'PLAN/003', stage: 1, status: 2 },
			{ refNum: 'PLAN/004', stage: 1, status: 3 },
			{ refNum: 'PLAN/005', stage: 1, status: 4 },
			{ refNum: 'PLAN/006', stage: 1, status: 5 }
		];

		for (let i = 0; i < params.length; i++) {
			const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params[i], plans[i]);
			await assert.doesNotReject(() => planPage(mockReq, mockRes));

			const [view, data] = mockRes.render.mock.calls[0].arguments;
			const html = nunjucks.render(view, data);

			const expectedTags = [statusTag(plans[i].status, StatusTag), 'Cannot start yet', 'Cannot start yet'];
			const tags = [data.tagG2, data.tagG3, data.tagE];

			for (let j = 0; j < expectedTags.length; j++) {
				assert.strictEqual(expectedTags[j], tags[j], `expected ${expectedTags[j]} but got ${tags[j]}`);
			}
		}
	});

	it('should render task table links correctly for case 2 (G1, G2 complete)', async () => {
		const param = { refNum: 'PLAN-001' };

		const plan = { refNum: 'PLAN/001', stage: 2, status: 0 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param, plan);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedLinks = ['/applicationPage/PLAN-001/1', `/applicationPage/PLAN-001/2`, null];
		const links = [data.hrefG2, data.hrefG3, data.hrefE];
		const expectedHTML = 'class="govuk-link govuk-task-list__link" href="/applicationPage/PLAN-001/2"';

		for (let i = 0; i < expectedLinks.length; i++) {
			assert.strictEqual(expectedLinks[i], links[i], `expected ${expectedLinks[i]} but got ${links[i]}`);
		}

		assert.ok(html.includes(expectedHTML), `expected html to contain ${expectedHTML}`);
	});

	it('should render task tag correctly for case 2 (G1, G2 complete)', async () => {
		const param = { refNum: 'PLAN-001' };

		const plan = { refNum: 'PLAN/001', stage: 2, status: 0 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param, plan);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedTags = [
			'Completed',
			'<strong class="govuk-tag govuk-tag--green">Ready to start</strong>',
			'Cannot start yet'
		];
		const tags = [data.tagG2, data.tagG3, data.tagE];
		const expectedHTML = `<div class="govuk-task-list__status" id="task-list-3-status"><strong class="govuk-tag govuk-tag--green">Ready to start</strong></div>`;

		for (let i = 0; i < expectedTags.length; i++) {
			assert.strictEqual(tags[i], expectedTags[i], `expected ${expectedTags[i]} but got ${tags[i]}`);
		}

		assert.ok(cleanHtml(html).includes(cleanHtml(expectedHTML)), `expected html to contain ${expectedHTML}`);
	});

	it('should render task tag correctly for case 2 (G1, G2 complete) if status != 0', async () => {
		const params = [
			{ refNum: 'PLAN-002' },
			{ refNum: 'PLAN-003' },
			{ refNum: 'PLAN-004' },
			{ refNum: 'PLAN-005' },
			{ refNum: 'PLAN-006' }
		];

		const plans = [
			{ refNum: 'PLAN/002', stage: 2, status: 1 },
			{ refNum: 'PLAN/003', stage: 2, status: 2 },
			{ refNum: 'PLAN/004', stage: 2, status: 3 },
			{ refNum: 'PLAN/005', stage: 2, status: 4 },
			{ refNum: 'PLAN/006', stage: 2, status: 5 }
		];

		for (let i = 0; i < params.length; i++) {
			const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params[i], plans[i]);
			await assert.doesNotReject(() => planPage(mockReq, mockRes));

			const [view, data] = mockRes.render.mock.calls[0].arguments;
			const html = nunjucks.render(view, data);

			const expectedTags = ['Completed', statusTag(plans[i].status, StatusTag), 'Cannot start yet'];
			const tags = [data.tagG2, data.tagG3, data.tagE];

			for (let j = 0; j < expectedTags.length; j++) {
				assert.strictEqual(expectedTags[j], tags[j], `expected ${expectedTags[j]} but got ${tags[j]}`);
			}
		}
	});

	it('should render task table links correctly for case 3 (G1, G2, G3 complete)', async () => {
		const param = { refNum: 'PLAN-001' };

		const plan = { refNum: 'PLAN/001', stage: 3, status: 0 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param, plan);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedLinks = ['/applicationPage/PLAN-001/1', `/applicationPage/PLAN-001/2`, `/applicationPage/PLAN-001/3`];
		const links = [data.hrefG2, data.hrefG3, data.hrefE];
		const expectedHTML = 'class="govuk-link govuk-task-list__link" href="/applicationPage/PLAN-001/3"';

		for (let i = 0; i < expectedLinks.length; i++) {
			assert.strictEqual(expectedLinks[i], links[i], `expected ${expectedLinks[i]} but got ${links[i]}`);
		}

		assert.ok(html.includes(expectedHTML), `expected html to contain ${expectedHTML}`);
	});

	it('should render task tag correctly for case 3 (G1, G2, G3 complete)', async () => {
		const param = { refNum: 'PLAN-001' };

		const plan = { refNum: 'PLAN/001', stage: 3, status: 0 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param, plan);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedTags = [
			'Completed',
			'Completed',
			'<strong class="govuk-tag govuk-tag--green">Ready to start</strong>'
		];
		const tags = [data.tagG2, data.tagG3, data.tagE];
		const expectedHTML = `<div class="govuk-task-list__status" id="task-list-4-status"><strong class="govuk-tag govuk-tag--green">Ready to start</strong></div>`;

		for (let i = 0; i < expectedTags.length; i++) {
			assert.strictEqual(tags[i], expectedTags[i], `expected ${expectedTags[i]} but got ${tags[i]}`);
		}

		assert.ok(cleanHtml(html).includes(cleanHtml(expectedHTML)), `expected html to contain ${expectedHTML}`);
	});

	it('should render task tag correctly for case 3 (G1, G2, G3 complete) if status != 0', async () => {
		const params = [{ refNum: 'PLAN-002' }, { refNum: 'PLAN-003' }, { refNum: 'PLAN-004' }, { refNum: 'PLAN-005' }];

		const plans = [
			{ refNum: 'PLAN/002', stage: 3, status: 1 },
			{ refNum: 'PLAN/003', stage: 3, status: 2 },
			{ refNum: 'PLAN/004', stage: 3, status: 3 },
			{ refNum: 'PLAN/005', stage: 3, status: 4 }
		];

		for (let i = 0; i < params.length; i++) {
			const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params[i], plans[i]);
			await assert.doesNotReject(() => planPage(mockReq, mockRes));

			const [view, data] = mockRes.render.mock.calls[0].arguments;
			const html = nunjucks.render(view, data);

			const expectedTags = ['Completed', 'Completed', statusTag(plans[i].status, StatusTag)];
			const tags = [data.tagG2, data.tagG3, data.tagE];

			for (let j = 0; j < expectedTags.length; j++) {
				assert.strictEqual(expectedTags[j], tags[j], `expected ${expectedTags[j]} but got ${tags[j]}`);
			}
		}
	});

	it('should render task table links correctly for case 3 p2 (G1, G2, G3, E complete)', async () => {
		const param = { refNum: 'PLAN-001' };

		const plan = { refNum: 'PLAN/001', stage: 3, status: 5 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param, plan);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedLinks = ['/applicationPage/PLAN-001/1', '/applicationPage/PLAN-001/2', '/applicationPage/PLAN-001/3'];
		const links = [data.hrefG2, data.hrefG3, data.hrefE];
		const expectedHTML = 'class="govuk-link govuk-task-list__link" href="/applicationPage/PLAN-001/3"';

		for (let i = 0; i < expectedLinks.length; i++) {
			assert.strictEqual(expectedLinks[i], links[i], `expected ${expectedLinks[i]} but got ${links[i]}`);
		}

		assert.ok(html.includes(expectedHTML), `expected html to contain ${expectedHTML}`);
	});

	it('should render task tag correctly for case 3 p2 (G1, G2, G3, E complete)', async () => {
		const param = { refNum: 'PLAN-001' }; // status 5 == complete

		const plan = { refNum: 'PLAN/001', stage: 3, status: 5 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param, plan);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedTags = ['Completed', 'Completed', 'Completed'];
		const tags = [data.tagG2, data.tagG3, data.tagE];

		for (let i = 0; i < expectedTags.length; i++) {
			assert.strictEqual(tags[i], expectedTags[i], `expected ${expectedTags[i]} but got ${tags[i]}`);
		}
	});

	it('should render tab headings correctly', async () => {
		const param = { refNum: 'PLAN-001' };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(param);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

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
		const param = { refNum: 'PLAN-999' };

		const { planPage, mockRes, mockReq, logger } = initialiseTest(param);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		assert.strictEqual(logger.warn.mock.callCount(), 1);

		assert.deepStrictEqual(logger.warn.mock.calls[0].arguments, [{ planRef: 'PLAN/999' }, 'Plan not found']);

		assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 404);

		assert.strictEqual(mockRes.send.mock.calls[0].arguments[0], 'Plan not found');

		assert.strictEqual(mockRes.render.mock.callCount(), 0);
	});

	it('should return 404 when plan exists but is invalid', async () => {
		const param = { refNum: 'PLAN-001' };

		const plan = {
			refNum: 'PLAN/001',
			title: 'Error Plan',
			stage: 999,
			status: 999
		};

		const { planPage, mockRes, mockReq, logger } = initialiseTest(param, plan);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 404);

		assert.strictEqual(mockRes.send.mock.calls[0].arguments[0], 'Plan not found');
	});
});
