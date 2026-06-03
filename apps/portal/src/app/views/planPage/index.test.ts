// @ts-nocheck

import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildPlanPage } from './controller.ts';
import { JSDOM } from 'jsdom';

describe('plan page', () => {
	it('should render without error', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {},
			params: {
				refNum: 'PLAN-001',
				stage: '1'
			}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const planPage = buildPlanPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments.length, 2);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/planPage/view.njk');
	});

	it('should render notification banner if in state = action needed', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {},
			params: {
				refNum: 'PLAN-004',
				stage: '1',
				status: 3
			}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const planPage = buildPlanPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const banner = dom.window.document.querySelector('.govuk-notification-banner').textContent.trim();

		if (data.status == 3) {
			//status 3 == action needed
			assert.ok(banner);
			assert.ok(banner.includes('Action needed: Examination submission incomplete'));
		} else {
			assert.strictEqual(banner, null);
		}
	});

	it('should render title and caption correctly', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {},
			params: {
				refNum: 'PLAN-001',
				stage: '1'
			}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const planPage = buildPlanPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const data = mockRes.render.mock.calls[0].arguments[1];

		assert.ok(data.pageTitle.includes('East plan'));
		assert.ok(data.pageCaption.includes('PLAN/00'));
	});

	it('should render summary table correctly (Current stage, LPA, linked LPA)', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {},
			params: {
				refNum: 'PLAN-001',
				stage: '1'
			}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const planPage = buildPlanPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const tag = dom.window.document.querySelector('.govuk-tag');

		assert.ok(tag);
		assert.strictEqual(tag.textContent.trim(), 'Ready to Start');
		assert.strictEqual(data.leadLPA, 'Southampton');
		assert.strictEqual(data.linkedLPA, 'Romsey Town Council');
	});

	it('should render button if status == ready to start', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {},
			params: {
				refNum: 'PLAN-001',
				stage: '1'
			}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const planPage = buildPlanPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const button = dom.window.document.querySelector('.govuk-button');

		if (data.status == 0) {
			//status 0 == ready to start
			assert.ok(button);
			assert.strictEqual(button.textContent.trim(), 'Start Gateway 2 submission');
		} else {
			assert.strictEqual(button, null);
		}
	});

	it('should render task table headings correctly (g1, g2, g3, e)', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {},
			params: {
				refNum: 'PLAN-001',
				stage: '1'
			}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const planPage = buildPlanPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const tasks = [...dom.window.document.querySelectorAll('.govuk-task-list__name-and-hint')].map((task) =>
			task.firstElementChild?.textContent.trim()
		);

		assert.deepStrictEqual(tasks, [
			'Gateway 1 - self-assessment',
			'Gateway 2 - advisory check',
			'Gateway 3 - readiness check',
			'Examination'
		]);
	});

	it('should render task table links correctly for case 1 (g1 complete)', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {},
			params: {
				refNum: 'PLAN-001',
				stage: '1'
			}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const planPage = buildPlanPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

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
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {},
			params: {
				refNum: 'PLAN-003',
				stage: '2'
			}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const planPage = buildPlanPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

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
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {},
			params: {
				refNum: 'PLAN-004',
				stage: '3'
			}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const planPage = buildPlanPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

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
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {},
			params: {
				refNum: 'PLAN-006',
				stage: '3'
			}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const planPage = buildPlanPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const tasks = [...dom.window.document.querySelectorAll('.govuk-task-list__hint')];

		const text = tasks.at(-1).textContent.trim();

		assert.ok(text.includes('Completed on'), `Expected ${'Completed on'} instead got "${text}"`);
	});

	it('should render tab headings correctly', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {},
			params: {
				refNum: 'PLAN-001',
				stage: '1'
			}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const planPage = buildPlanPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => planPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const tabs = [...dom.window.document.querySelectorAll('.govuk-tabs__tab')].map((tab) => tab.textContent.trim());

		assert.deepStrictEqual(tabs, ['Gateway 2', 'Gateway 3', 'Examination']);
	});

	it('should return 404 when plan is not found', async () => {
		const warn = mock.fn();

		const mockReq = {
			session: {},
			params: {
				refNum: 'PLAN-999',
				stage: '1'
			}
		};

		const mockRes = {
			status: mock.fn(() => mockRes),
			send: mock.fn(),
			render: mock.fn()
		};

		const applicationPage = buildPlanPage({
			logger: { warn }
		});

		await applicationPage(mockReq, mockRes);
		assert.strictEqual(warn.mock.callCount(), 1);

		assert.deepStrictEqual(warn.mock.calls[0].arguments, [{ planRef: 'PLAN/999' }, 'Plan not found']);

		assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 404);

		assert.strictEqual(mockRes.send.mock.calls[0].arguments[0], 'Plan not found');

		assert.strictEqual(mockRes.render.mock.callCount(), 0);
	});
});
