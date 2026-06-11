// @ts-nocheck

import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildPlanPage } from './controller.ts';

function initialiseTest(params: {}, test: boolean, getPlans?) {
	const nunjucks = configureNunjucks();
	const mockRes = { render: mock.fn((view, data) => nunjucks.render(view, data)) };
	const mockReq = { session: {}, params };
	const mockDb = { $queryRaw: mock.fn() };
	const logger = mockLogger();
	const planPage = buildPlanPage({ db: mockDb, logger }, test, getPlans);
	return { planPage, mockRes, mockReq, nunjucks, logger };
}

describe('plan page', () => {
	it('should render without error', async () => {
		const params = { refNum: 'PLAN-001', stage: 1 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments.length, 2);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/planPage/view.njk');
	});

	it('should render notification banner if state = action needed', async () => {
		const params = { refNum: 'PLAN-004', stage: 1, status: 3 }; //status 3 == action needed

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		assert.ok(html.includes('class="govuk-notification-banner__heading"'));
		assert.ok(html.includes('Action needed: Examination submission incomplete'));
	});

	it('should not render notification banner if not state = action needed', async () => {
		const paramsSetArray = [
			{ refNum: 'PLAN-001', stage: 1, status: 0 },
			{ refNum: 'PLAN-002', stage: 1, status: 1 },
			{ refNum: 'PLAN-003', stage: 2, status: 2 },
			{ refNum: 'PLAN-005', stage: 3, status: 4 },
			{ refNum: 'PLAN-006', stage: 3, status: 5 }
		];
		for (const paramsSet of paramsSetArray) {
			const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(paramsSet);
			await assert.doesNotReject(() => planPage(mockReq, mockRes));

			const [view, data] = mockRes.render.mock.calls[0].arguments;
			const html = nunjucks.render(view, data);

			assert.ok(!html.includes('class="govuk-notification-banner__heading"'));
			assert.ok(!html.includes('Action needed: Examination submission incomplete'));
		}
	});

	it('should render title and caption correctly', async () => {
		const params = { refNum: 'PLAN-001', stage: 1 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		assert.strictEqual(data.pageTitle, 'East Borough Local Plan');
		assert.ok(html.includes('East Borough Local Plan'));
		assert.strictEqual(data.pageCaption, 'PLAN/001');
		assert.ok(html.includes('PLAN/001'));
	});

	it('should render summary table correctly (Current stage, LPA, linked LPA)', async () => {
		const params = { refNum: 'PLAN-001', stage: 1 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		assert.strictEqual(data.currentStage, 'Gateway 2');
		assert.ok(html.includes('Gateway 2'));
		assert.strictEqual(data.leadLPA, 'Southampton City Council');
		assert.ok(html.includes('Southampton City Council'));
		assert.strictEqual(data.linkedLPA, 'Romsey Town Council');
		assert.ok(html.includes('Romsey Town Council'));
	});

	it('should render Current status tag correctly', async () => {
		const params = { refNum: 'PLAN-001', stage: 1 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const targetTags = [
			{ className: 'govuk-tag govuk-tag--green', text: 'Ready to start' },
			{ className: 'govuk-tag govuk-tag--blue', text: 'In progress' },
			{ className: 'govuk-tag govuk-tag--yellow', text: 'With PINS' },
			{ className: 'govuk-tag govuk-tag--red', text: 'Action needed' },
			{ className: 'govuk-tag govuk-tag--grey', text: 'Invalid' },
			{ className: 'govuk-body', text: 'Completed' }
		];

		const rawTagClass = data.planStatusTag.match(/"([^"]+)"/)?.[1].trim();
		const rawTagText = data.planStatusTag.match(/>([^<]+)</)?.[1].trim();
		console.log(html);
		console.log(data);
		assert.ok(
			targetTags.some((tag) => tag.className === rawTagClass && tag.text === rawTagText),
			`Expected one of ${targetTags} but got ${rawTagClass}, ${rawTagText}`
		);
		assert.ok(
			html.includes(`<strong class="${rawTagClass}">${rawTagText}</strong>`),
			`expected <strong class="${rawTagClass}">${rawTagText}</strong>`
		);
	});

	it('should render button with correct link if status == ready to start', async () => {
		// 0 = ready to start
		const params = { refNum: 'PLAN-001', stage: 1, status: 0 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		assert.strictEqual(data.button, 'Start Gateway 2 submission');
		assert.ok(html.includes(`<a href="/applicationPage/PLAN-001/1" class="govuk-button">`));
	});

	it('should not render button if status != ready to start', async () => {
		const paramsSetArray = [
			{ refNum: 'PLAN-002', stage: 1, status: 1 },
			{ refNum: 'PLAN-003', stage: 2, status: 2 },
			{ refNum: 'PLAN-004', stage: 2, status: 3 },
			{ refNum: 'PLAN-005', stage: 3, status: 4 },
			{ refNum: 'PLAN-006', stage: 3, status: 5 }
		];

		for (const params of paramsSetArray) {
			const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params);
			await assert.doesNotReject(() => planPage(mockReq, mockRes));

			const [view, data] = mockRes.render.mock.calls[0].arguments;
			const html = nunjucks.render(view, data);

			assert.strictEqual(data.button, null);
			assert.ok(!html.includes(`<a href="/applicationPage/PLAN-001/1" class="govuk-button">`));
		}
	});

	it('should render task table headings correctly (g1, g2, g3, e)', async () => {
		const params = { refNum: 'PLAN-001', stage: 1, status: 0 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const tasks = [...dom.window.document.querySelectorAll('.govuk-task-list__name-and-hint')].map((task) =>
			task.firstElementChild?.textContent.trim()
		);

		const headings = [...html.matchAll(/<th scope="col" class="govuk-table__header">([^<]+)<\/th>/g)].map(
			(match) => match[1]
		);

		const expectedHeadings = [
			'Reference Number',
			'Lead Local Planning Authority',
			'Plan Title',
			'Current Stage',
			'Status'
		];

		assert.strictEqual(data.button, 'Start Gateway 2 submission');
		assert.ok(html.includes(`<a href="/applicationPage/PLAN-001/1" class="govuk-button">`));

		assert.deepStrictEqual(headings, expectedHeadings, `Expected ${expectedHeadings} instead got "${headings}"`);
		assert.deepStrictEqual(tasks, [
			'Gateway 1 - self-assessment',
			'Gateway 2 - advisory check',
			'Gateway 3 - readiness check',
			'Examination'
		]);
	});

	it('should render task table links correctly for case 1 (g1 complete)', async () => {
		const params = { refNum: 'PLAN-001', stage: 1, status: 0 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		assert.strictEqual(data.hrefG2, 'Start Gateway 2 submission');
		assert.strictEqual(data.hrefG3, 'Start Gateway 2 submission');
		assert.strictEqual(data.hrefE, 'Start Gateway 2 submission');

		assert.ok(html.includes(`<a href="/applicationPage/PLAN-001/1" class="govuk-button">`));

		const tasks = [...dom.window.document.querySelectorAll('.govuk-task-list__link')];

		const linkText = ['Gateway 1 - self-assessment', 'Gateway 2 - advisory check'];

		const linkLink = [`/applicationPage/${mockReq.params.refNum}/1`];

		const taskText = tasks.map((task) => task.textContent.trim());

		assert.deepStrictEqual(taskText, linkText, `expected ${linkText} but got ${taskText}`);

		assert.deepStrictEqual(tasks[0].getAttribute('href'), '#', `expected ${linkText} but got ${taskText}`); //g1 link unknown so testing seperate

		tasks.slice(1).forEach((task, i) => {
			const href = task.getAttribute('href');
			assert.strictEqual(href, linkLink[i], `Expected ${linkLink[i]} instead got "${href}"`);
		});
	});

	it('should render task table links correctly for case 2 (g1, g2 complete)', async () => {
		const params = { refNum: 'PLAN-001', stage: 1, status: 0 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		assert.strictEqual(data.button, 'Start Gateway 2 submission');
		assert.ok(html.includes(`<a href="/applicationPage/PLAN-001/1" class="govuk-button">`));

		const tasks = [...dom.window.document.querySelectorAll('.govuk-task-list__link')];

		const linkText = ['Gateway 1 - self-assessment', 'Gateway 2 - advisory check', 'Gateway 3 - readiness check'];

		const linkLink = [`/applicationPage/${mockReq.params.refNum}/1`, `/applicationPage/${mockReq.params.refNum}/2`];

		const taskText = tasks.map((task) => task.textContent.trim());

		assert.deepStrictEqual(taskText, linkText, `expected ${linkText} but got ${taskText}`);

		assert.deepStrictEqual(tasks[0].getAttribute('href'), '#', `expected ${linkText} but got ${taskText}`); //g1 link unknown so testing seperate

		tasks.slice(1).forEach((task, i) => {
			const href = task.getAttribute('href');
			assert.strictEqual(href, linkLink[i], `Expected ${linkLink[i]} instead got "${href}"`);
		});
	});

	it('should render task table links correctly for case 3 (g1, g2, g3, e (potentially) complete)', async () => {
		const params = { refNum: 'PLAN-001', stage: 1, status: 0 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		assert.strictEqual(data.button, 'Start Gateway 2 submission');
		assert.ok(html.includes(`<a href="/applicationPage/PLAN-001/1" class="govuk-button">`));

		const tasks = [...dom.window.document.querySelectorAll('.govuk-task-list__link')];

		const linkText = [
			'Gateway 1 - self-assessment',
			'Gateway 2 - advisory check',
			'Gateway 3 - readiness check',
			'Examination'
		];

		const linkLink = [
			`/applicationPage/${mockReq.params.refNum}/1`,
			`/applicationPage/${mockReq.params.refNum}/2`,
			`/applicationPage/${mockReq.params.refNum}/3`
		];

		const taskText = tasks.map((task) => task.textContent.trim());

		assert.deepStrictEqual(taskText, linkText, `expected ${linkText} but got ${taskText}`);

		assert.deepStrictEqual(tasks[0].getAttribute('href'), '#', `expected ${linkText} but got ${taskText}`); //g1 link unknown so testing seperate

		tasks.slice(1).forEach((task, i) => {
			const href = task.getAttribute('href');
			assert.strictEqual(href, linkLink[i], `Expected ${linkLink[i]} instead got "${href}"`);
		});
	});

	it('should render Examinations as completed if it is', async () => {
		const params = { refNum: 'PLAN-001', stage: 1, status: 0 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		assert.strictEqual(data.button, 'Start Gateway 2 submission');
		assert.ok(html.includes(`<a href="/applicationPage/PLAN-001/1" class="govuk-button">`));

		const tasks = [...dom.window.document.querySelectorAll('.govuk-task-list__hint')];

		const text = tasks.at(-1).textContent.trim();

		assert.ok(text.includes('Completed on'), `Expected ${'Completed on'} instead got "${text}"`);
	});

	it('should render tab headings correctly', async () => {
		const tabs = [...dom.window.document.querySelectorAll('.govuk-tabs__tab')].map((tab) => tab.textContent.trim());

		assert.deepStrictEqual(tabs, ['Gateway 2', 'Gateway 3', 'Examination']);
	});

	it('should return 404 when plan is not found', async () => {
		const params = { refNum: 'PLAN-999', stage: 1, status: 0 };

		const { planPage, mockRes, mockReq, nunjucks, logger } = initialiseTest(params);
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		assert.strictEqual(data.button, 'Start Gateway 2 submission');
		assert.ok(html.includes(`<a href="/applicationPage/PLAN-001/1" class="govuk-button">`));

		await applicationPage(mockReq, mockRes);
		assert.strictEqual(warn.mock.callCount(), 1);

		assert.deepStrictEqual(warn.mock.calls[0].arguments, [{ planRef: 'PLAN/999' }, 'Plan not found']);

		assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 404);

		assert.strictEqual(mockRes.send.mock.calls[0].arguments[0], 'Plan not found');

		assert.strictEqual(mockRes.render.mock.callCount(), 0);
	});
});
