// @ts-nocheck
import { mockLogger } from '@planning-inspectorate/core/testing';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildLandingPage } from './controller.ts';
import { buildTestPlans, mockPlan, mockApplicationDoc } from '../../types.ts';

function initialiseTest(plans?: unknown[]) {
	const nunjucks = configureNunjucks();
	const mockRes = { render: mock.fn((view, data) => nunjucks.render(view, data)) };
	const mockReq = { session: { authenticatedEmail: 'user@example.com' } };
	const logger = mockLogger();
	const mockService = {
		logger,
		getPlans: mock.fn(async () => plans ?? buildTestPlans())
	};
	const landingPage = buildLandingPage(mockService);
	return { landingPage, mockRes, mockReq, mockService, nunjucks, logger };
}

describe('landing page', () => {
	it('should render without error', async () => {
		const { landingPage, mockRes, mockReq } = initialiseTest();
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		assert.strictEqual(mockRes.render.mock.callCount(), 1);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments.length, 2);
		assert.strictEqual(mockRes.render.mock.calls[0].arguments[0], 'views/landing-page/view.njk');
	});

	it('should request plans for the authenticated email', async () => {
		const { landingPage, mockRes, mockService, mockReq } = initialiseTest();

		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		assert.strictEqual(mockService.getPlans.mock.calls[0].arguments[0], 'user@example.com');
	});

	it('should render title and dynamic local planning authority caption', async () => {
		const plans = [
			mockPlan({
				refNum: 'PLAN-001',
				leadLPA: 'Dynamic Borough Council',
				title: 'East plan',
				documents: [mockApplicationDoc()]
			})
		];
		const { landingPage, mockRes, mockReq, nunjucks } = initialiseTest(plans);
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const expectedTitle = 'My plans';
		const expectedCaption = 'Dynamic Borough Council';

		assert.strictEqual(data.pageTitle, expectedTitle, `Expected ${expectedTitle} instead got ${data.pageTitle}`);
		assert.strictEqual(data.pageCaption, expectedCaption);
		assert.ok(html.includes(`<span class="govuk-caption-xl">${expectedCaption}</span>`));
	});

	it('should render reference, title and type in the same order as the table headings', async () => {
		const localPlan = mockPlan({
			refNum: 'PLAN-001',
			title: 'East plan',
			type: { id: 'local-plan', displayName: 'Local Plan', displayOrder: 1 }
		});
		const { landingPage, mockRes, mockReq } = initialiseTest([localPlan]);
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const viewModel = mockRes.render.mock.calls[0].arguments[1];
		assert.deepStrictEqual(viewModel.plans, [
			[
				{ html: '<a class="govuk-link" data-cy="plan-link" href="/manage-local-plans/PLAN-001">PLAN-001</a>' },
				{ text: 'East plan' },
				{ text: 'Local Plan' }
			]
		]);
		assert.strictEqual(viewModel.noPlansFlag, false);
	});

	it('should warn if no plans found and display No plans available', async () => {
		const { landingPage, mockRes, mockReq, nunjucks, logger } = initialiseTest([]);
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		const loggerMessage = logger.warn.mock.calls[0].arguments;
		const errorMessage = 'No plans available';

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

		const expectedHeadings = ['Reference number', 'Plan title', 'Type'];

		assert.deepStrictEqual(headings, expectedHeadings, `Expected ${expectedHeadings} instead got "${headings}"`);
	});

	it('should filter out incorrect plans and log error', async () => {
		const invalidPlan = {
			refNum: 'PLAN-BAD',
			leadLPA: 'Test',
			title: 'Bad plan',
			stage: 1,
			status: 0,
			dates: '',
			sections: [0, 0, 0],
			documents: []
		};
		const validTestPlan = mockPlan({
			refNum: 'PLAN-GOOD',
			leadLPA: 'Southampton',
			title: 'Good plan',
			documents: [mockApplicationDoc()]
		});
		const { landingPage, mockRes, mockReq, nunjucks, logger } = initialiseTest([invalidPlan, validTestPlan]);
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		assert.deepStrictEqual(logger.warn.mock.calls[0].arguments, [{ planRef: 'PLAN-BAD' }, 'Invalid plan']);
		assert.strictEqual(data.pageCaption, 'Southampton');
		assert.ok(!html.includes('PLAN-BAD'), 'expected invalid plan to be filtered out');
		assert.ok(html.includes('PLAN-GOOD'), 'expected valid plan to be rendered');
	});

	it('should render correct links', async () => {
		const { landingPage, mockRes, mockReq, nunjucks } = initialiseTest();
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));

		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);

		for (const plan of data.plans) {
			const expectedRefNum = plan[0].html.match(/>([^<]+)</)?.[1]; // 0 for first cell - where link should be
			const expectedHref = '/manage-local-plans/' + encodeURIComponent(expectedRefNum);

			assert.ok(expectedRefNum.includes('PLAN'), `expected ref to contain PLAN`);
			assert.ok(
				html.includes(`<a class="govuk-link" data-cy="plan-link" href="${expectedHref}">${expectedRefNum}</a>`)
			);
		}
	});

	for (const planType of [
		{ id: 'local-plan', displayName: 'Local Plan', displayOrder: 1 },
		{ id: 'other', displayName: 'Other', displayOrder: 2 }
	]) {
		it(`should render the ${planType.displayName} type as text`, async () => {
			const { landingPage, mockRes, mockReq, nunjucks } = initialiseTest([mockPlan({ type: planType })]);
			await assert.doesNotReject(() => landingPage(mockReq, mockRes));

			const [view, viewModel] = mockRes.render.mock.calls[0].arguments;
			const renderedHtml = nunjucks.render(view, viewModel);
			assert.strictEqual(viewModel.plans[0][2].text, planType.displayName);
			assert.ok(renderedHtml.includes(planType.displayName));
			assert.ok(!renderedHtml.includes('[object Object]'));
			assert.ok(!renderedHtml.includes('<strong class="govuk-tag'));
		});
	}
});
