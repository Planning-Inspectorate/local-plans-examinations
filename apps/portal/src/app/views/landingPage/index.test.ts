// @ts-nocheck
import fs from 'node:fs';
import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildLandingPage } from './controller.ts';
import { JSDOM } from 'jsdom';

describe('landing page', () => {
	it('should render without error', async () => {
		const nunjucks = configureNunjucks();
		// mock response that calls nunjucks to render a result
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const landingPage = buildLandingPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments.length, 2);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/landingPage/view.njk');
	});

	it('should render title and caption correctly', async () => {
		const nunjucks = configureNunjucks();
		// mock response that calls nunjucks to render a result
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const landingPage = buildLandingPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;

		assert.strictEqual(data.pageTitle, 'My plans', `Expected ${data.pageTitle} instead got "${'My plans'}"`);
		assert.strictEqual(
			data.pageCaption,
			'Southampton City Council',
			`Expected ${data.pageCaption} instead got "${'Southampton City Council'}"`
		);
	});

	it('should render correct status tags', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const landingPage = buildLandingPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const tags = [...dom.window.document.querySelectorAll('.govuk-tag')];

		const targetTags = [
			{
				className: 'govuk-tag--green',
				text: 'Ready to Start'
			},
			{
				className: 'govuk-tag--blue',
				text: 'In Progress'
			},
			{
				className: 'govuk-tag--yellow',
				text: 'With PINS'
			},
			{
				className: 'govuk-tag--red',
				text: 'Action needed'
			},
			{
				className: 'govuk-tag--grey',
				text: 'Invalid'
			}
		];

		for (const targetTag of targetTags) {
			assert.ok(
				tags.some((tag) => tag.className.includes(targetTag.className) && tag.textContent.trim() === targetTag.text),
				`Expected ${targetTag.className} tag with text "${targetTag.text}"`
			);
		}
	});

	it('should render correct links', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};

		const landingPage = buildLandingPage({ db: mockDb, logger: mockLogger() });
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const links = [...dom.window.document.querySelectorAll('a.govuk-link')];

		for (const link of links) {
			const processedPlanRef = '/planPage/' + link.textContent.trim().replace('/', '-');
			const href = link.getAttribute('href');
			assert.strictEqual(href, processedPlanRef, `Expected ${processedPlanRef} instead got "${href}"`);
		}
	});

	it('should render correct table headings', async () => {
		const nunjucks = configureNunjucks();
		const mockRes = {
			render: mock.fn((view, data) => nunjucks.render(view, data))
		};
		const mockReq = {
			session: {}
		};
		const mockDb = {
			$queryRaw: mock.fn()
		};
		const landingPage = buildLandingPage({
			db: mockDb,
			logger: mockLogger()
		});

		await landingPage(mockReq, mockRes);
		const [view, data] = mockRes.render.mock.calls[0].arguments;

		const html = nunjucks.render(view, data);
		const dom = new JSDOM(html);

		const headings = [...dom.window.document.querySelectorAll('thead th')].map((heading) => heading.textContent.trim());

		const expectedHeadings = [
			'Reference Number',
			'Lead Local Planning Authority',
			'Plan Title',
			'Current Stage',
			'Status'
		];

		assert.deepStrictEqual(headings, expectedHeadings, `Expected ${expectedHeadings} instead got "${headings}"`);
	});

	it('should return 404 when plan is not found/ invalid', async () => {
		const warn = mock.fn();

		mock.method(fs, 'readFileSync', () =>
			JSON.stringify([
				{
					refNum: 'PLAN/999'
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

		const landingPage = buildLandingPage({
			logger: { warn }
		});

		await landingPage(mockReq, mockRes);

		assert.strictEqual(warn.mock.callCount(), 1);

		assert.deepStrictEqual(warn.mock.calls[0].arguments, [{ planRef: 'PLAN/999' }, 'Plan not found']);

		assert.strictEqual(mockRes.status.mock.calls[0].arguments[0], 404);

		assert.strictEqual(mockRes.send.mock.calls[0].arguments[0], 'Plan not found');

		assert.strictEqual(mockRes.render.mock.callCount(), 0);
	});
});
