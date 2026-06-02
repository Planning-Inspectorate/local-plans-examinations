// @ts-nocheck

import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildApplicationPage } from './controller.ts';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';

describe('application page', () => {
	it('should render without error', async () => {
		const nunjucks = configureNunjucks();
		// mock response that calls nunjucks to render a result
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
		const applicationPage = buildApplicationPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));
		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments.length, 2);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/applicationPage/view.njk');
	});

	it('should display title and caption correctly', async () => {
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

		const applicationPage = buildApplicationPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;

		assert.strictEqual(
			data.pageTitle,
			'Gateway 2 application',
			`Expected Gateway 2 application but got "${data.pageTitle}"`
		);
		assert.ok(data.pageCaption.includes('PLAN/00'), `Expected PLAN/00 but got "${data.pageCaption}"`);
	});

	it('should render summary table', async () => {
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

		const applicationPage = buildApplicationPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const summaryList = [
			...dom.window.document.querySelectorAll('.govuk-summary-list--no-border .govuk-summary-list__value')
		].map((value) => value.textContent.trim());

		const expectedValues = ['East plan', '21 July 2026', 'Southampton', 'Romsey Town Council'];

		assert.deepStrictEqual(summaryList, expectedValues, `Expected ${expectedValues} but got "${summaryList}"`);
	});

	it('should render a save and come back button', async () => {
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

		const applicationPage = buildApplicationPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const backLink = dom.window.document.querySelector('.govuk-body .govuk-link').textContent.trim();

		const expectedText = 'Save and come back later';

		assert.ok(backLink);
		assert.strictEqual(backLink, expectedText, `Expected ${expectedText} but got "${backLink}"`);
	});

	it('should render Application incomplete', async () => {
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

		const applicationPage = buildApplicationPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const tableHeader = dom.window.document.querySelector('.govuk-task-list__name-and-hint').textContent.trim();

		const expectedText = 'Application incomplete';

		assert.ok(tableHeader.startsWith(expectedText), `Expected ${expectedText} but got "${tableHeader}"`);
	});

	it('should render (Procedural documents, 2. Consultation documents 3. Submit) and correct tag for each', async () => {
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

		const applicationPage = buildApplicationPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const tableHeaders = [...dom.window.document.querySelectorAll('.govuk-table thead tr th:first-child')].map(
			(header) => header.textContent.trim()
		);

		const expectedHeaders = ['1. Procedural documents', '2. Consultation documents', '3. Submit'];

		const tags = [...dom.window.document.querySelectorAll('.govuk-table__header.govuk-\\!-text-align-right')].map(
			(tag) => tag.textContent.trim()
		);

		const expectedTags = ['Not started', 'Not started', 'Not started'];
		console.log('expected:', expectedTags);

		assert.deepStrictEqual(tableHeaders, expectedHeaders, `Expected ${expectedHeaders} but got "${tableHeaders}"`);
		assert.deepStrictEqual(tags, expectedTags, `Expected ${expectedTags} but got "${tags}"`);
	});

	it('should render correct Procedural documents', async () => {
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

		const applicationPage = buildApplicationPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const lists = dom.window.document.querySelectorAll('.govuk-summary-list');

		const docs = [
			...lists[1].querySelectorAll('.govuk-summary-list__key') //gets second (Procedural) list
		].map((doc) => doc.textContent.trim());

		const expectedDocs = [
			'Gateway 2 cover letter',
			'Local plan timetable',
			'Project initiation document',
			'Draft statement of compliance',
			'Draft statement of soundness'
		];

		assert.deepStrictEqual(docs, expectedDocs, `Expected ${expectedDocs} but got "${docs}"`);
	});

	it('should render correct Consultation documents', async () => {
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

		const applicationPage = buildApplicationPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const lists = dom.window.document.querySelectorAll('.govuk-summary-list');

		const docs = [
			...lists[2].querySelectorAll('.govuk-summary-list__key') //gets third (Consultation documents) list
		].map((doc) => doc.textContent.trim());

		const expectedDocs = [
			'Consultation statement',
			'Consultation summary for scoping consultation',
			'Consultation summary for proposed local plan content and evidence documents',
			'Notice of intention to commence local plan preparation',
			'Scoping consultation documents',
			'Consultation summary of feedback to scoping consultation',
			'Gateway 1 Self assessment of readiness',
			'Consultation on proposed local plan content and evidence documents',
			'Summary of consultation responses'
		];

		assert.deepStrictEqual(docs, expectedDocs, `Expected ${expectedDocs} but got "${docs}"`);
	});

	it('should render correct Submit', async () => {
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

		const applicationPage = buildApplicationPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => applicationPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const lists = dom.window.document.querySelectorAll('.govuk-summary-list');

		const docs = [
			...lists[3].querySelectorAll('.govuk-summary-list__key') //gets second summary list
		].map((doc) => doc.textContent.trim());

		const expectedDocs = ['Accept declaration and submit'];

		assert.deepStrictEqual(docs, expectedDocs, `Expected ${expectedDocs} but got "${docs}"`);
	});

	it('should return 404 when plan is not found', async () => {
		const warn = mock.fn();

		mock.method(fs, 'readFileSync', () =>
			JSON.stringify([
				{
					refNum: 'PLAN/001'
				}
			])
		);

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

		const applicationPage = buildApplicationPage({
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
