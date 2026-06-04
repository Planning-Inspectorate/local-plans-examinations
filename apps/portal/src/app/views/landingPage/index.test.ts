// @ts-nocheck
import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildLandingPage } from './controller.ts';
import { JSDOM } from 'jsdom';
import * as types from '../../types.ts';

function initialiseTest() {
	const nunjucks = configureNunjucks();
	const mockRes = { render: mock.fn((view, data) => nunjucks.render(view, data)) };
	const mockReq = { session: {} };
	const mockDb = { $queryRaw: mock.fn() };
	const landingPage = buildLandingPage({ db: mockDb, logger: mockLogger() });
	return { landingPage, mockRes, mockReq, nunjucks };
}

describe('landing page', () => {
	it('should render without error', async () => {
		const { landingPage, mockRes, mockReq, nunjucks } = initialiseTest();
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments.length, 2);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/landingPage/view.njk');
	});

	it('should render title and caption correctly', async () => {
		const { landingPage, mockRes, mockReq, nunjucks } = initialiseTest();
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
		const { landingPage, mockRes, mockReq, nunjucks } = initialiseTest();
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const targetTags = [
			{ className: 'govuk-tag govuk-tag--green', text: 'Ready to Start' },
			{ className: 'govuk-tag govuk-tag--blue', text: 'In Progress' },
			{ className: 'govuk-tag govuk-tag--yellow', text: 'With PINS' },
			{ className: 'govuk-tag govuk-tag--red', text: 'Action needed' },
			{ className: 'govuk-tag govuk-tag--grey', text: 'Invalid' },
			{ className: 'govuk-body', text: 'Completed' }
		];

		for (const plan of data.plans) {
			const rawTagClass = plan[4].html.match(/"([^"]+)"/)?.[1]; // 4 for last cell - where tag should be
			const rawTagText = plan[4].html.match(/>([^<]+)</)?.[1];
			console.log({ className: rawTagClass, text: rawTagText });

			assert.ok(
				targetTags.some((tag) => tag.className === rawTagClass && tag.text === rawTagText),
				`Expected one of ${targetTags} but got "${(rawTagClass, rawTagText)}"`
			);

			assert.ok(html.includes(`<strong class="${rawTagClass}">${rawTagText}</strong>`));
		}
	});

	it('should render correct links', async () => {
		const { landingPage, mockRes, mockReq, nunjucks } = initialiseTest();
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		for (const plan of data.plans) {
			const expectedRefNum = plan[0].html.match(/>([^<]+)</)?.[1]; // 0 for first cell - where link should be
			const expectedHref = '/planPage/' + expectedRefNum.replace('/', '-');

			assert.ok(html.includes(`<a class="govuk-link" href="${expectedHref}">${expectedRefNum}</a>`));
		}
	});

	it('should render correct table headings', async () => {
		const { landingPage, mockRes, mockReq, nunjucks } = initialiseTest();
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;

		const html = nunjucks.render(view, data);

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

		assert.deepStrictEqual(headings, expectedHeadings, `Expected ${expectedHeadings} instead got "${headings}"`);
	});
});
