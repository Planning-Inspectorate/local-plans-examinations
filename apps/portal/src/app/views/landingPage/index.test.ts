// @ts-nocheck
import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildLandingPage } from './controller.ts';
import { buildTestPlans, mockPlan, mockApplicationDoc } from '../../types.ts';

function initialiseTest(plans?: unknown[]) {
	const nunjucks = configureNunjucks();
	const mockRes = { render: mock.fn((view, data) => nunjucks.render(view, data)) };
	const mockReq = { session: {} };
	const logger = mockLogger();
	const mockService = {
		logger,
		getPlans: mock.fn(async () => plans ?? buildTestPlans())
	};
	const landingPage = buildLandingPage(mockService);
	return { landingPage, mockRes, mockReq, nunjucks, logger };
}

describe('landing page', () => {
	it('should render without error', async () => {
		const { landingPage, mockRes, mockReq } = initialiseTest();
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments.length, 2);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/landingPage/view.njk');
	});

	it('should render title and caption correctly', async () => {
		const { landingPage, mockRes, mockReq } = initialiseTest();
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;

		const expectedTitle = 'My plans';
		const expectedCaption = 'Southampton City Council';

		assert.strictEqual(data.pageTitle, expectedTitle, `Expected ${expectedTitle} instead got ${data.pageTitle}`);
		assert.strictEqual(
			data.pageCaption,
			expectedCaption,
			`Expected ${expectedCaption} instead got ${data.pageCaption}`
		);
	});

	it('should render plan data from service', async () => {
		const plans = [
			mockPlan({ refNum: 'PLAN/001', leadLPA: 'Southampton', title: 'East plan', documents: [mockApplicationDoc()] })
		];
		const { landingPage, mockRes, mockReq } = initialiseTest(plans);
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;

		const refNum = data.plans[0][0].html.match(/>([^<]+)</)?.[1];

		assert.deepStrictEqual(refNum, 'PLAN/001', `Expected PLAN/001 instead got ${refNum}`);
	});

	it('should warn if no plans found and display No plans to display', async () => {
		const { landingPage, mockRes, mockReq, nunjucks, logger } = initialiseTest([]);
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const loggerMessage = logger.warn.mock.calls[0].arguments;
		const errorMessage = 'No plans to display';

		assert.deepStrictEqual(
			loggerMessage,
			['No plans found'],
			`Expected ["No plans found"] instead got ${loggerMessage}`
		);
		assert.ok(html.includes(errorMessage), `expected ${errorMessage}`);
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

	it('should filter out incorrect plans and log error', async () => {
		const invalidPlan = {
			refNum: 'PLAN/BAD',
			leadLPA: 'Test',
			title: 'Bad plan',
			stage: 1,
			status: 0,
			dates: '',
			sections: [0, 0, 0],
			documents: []
		};
		const validTestPlan = mockPlan({
			refNum: 'PLAN/GOOD',
			leadLPA: 'Southampton',
			title: 'Good plan',
			documents: [mockApplicationDoc()]
		});
		const { landingPage, mockRes, mockReq, nunjucks, logger } = initialiseTest([invalidPlan, validTestPlan]);
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		assert.deepStrictEqual(logger.warn.mock.calls[0].arguments, [{ planRef: 'PLAN/BAD' }, 'Invalid plan']);
		assert.ok(!html.includes('PLAN/BAD'), 'expected invalid plan to be filtered out');
		assert.ok(html.includes('PLAN/GOOD'), 'expected valid plan to be rendered');
	});

	it('should render correct links', async () => {
		const { landingPage, mockRes, mockReq, nunjucks } = initialiseTest();
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		for (const plan of data.plans) {
			const expectedRefNum = plan[0].html.match(/>([^<]+)</)?.[1]; // 0 for first cell - where link should be
			const expectedHref = '/planPage/' + expectedRefNum.replace('/', '-');

			assert.ok(expectedRefNum.includes('PLAN'), `expected ref to contain PLAN`);
			assert.ok(html.includes(`<a class="govuk-link" href="${expectedHref}">${expectedRefNum}</a>`));
		}
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

			assert.ok(
				targetTags.some((tag) => tag.className === rawTagClass && tag.text === rawTagText),
				`Expected one of ${targetTags} but got ${rawTagClass}, ${rawTagText}`
			);

			assert.ok(
				html.includes(`<strong class="${rawTagClass}">${rawTagText}</strong>`),
				`expected <strong class="${rawTagClass}">${rawTagText}</strong>`
			);
		}
	});
});
