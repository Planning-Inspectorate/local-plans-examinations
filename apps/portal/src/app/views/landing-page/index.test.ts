// @ts-nocheck
import { mockLogger } from '@planning-inspectorate/core/testing';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildLandingPage } from './controller.ts';

function mockCase(overrides = {}) {
	return {
		reference: 'PLAN-001',
		planTitle: 'East plan',
		email: 'user@example.com',
		createdAt: new Date('2026-01-01'),
		gateway1Date: null,
		gateway2Date: null,
		gateway3Date: null,
		submissionDate: null,
		lpas: [{ lpaName: 'Southampton' }],
		gateway2Info: null,
		gateway3Info: null,
		...overrides
	};
}

function buildTestCases() {
	return [
		mockCase({ reference: 'PLAN-001', lpas: [{ lpaName: 'Southampton' }] }),
		mockCase({
			reference: 'PLAN-002',
			lpas: [{ lpaName: 'Portsmouth' }],
			gateway2Info: { actualDate: new Date('2026-05-07') }
		}),
		mockCase({
			reference: 'PLAN-003',
			lpas: [{ lpaName: 'Winchester' }],
			gateway2Info: { actualDate: new Date('2026-05-07'), reportIssuedDate: new Date('2026-06-01') }
		}),
		mockCase({
			reference: 'PLAN-004',
			lpas: [{ lpaName: 'Eastleigh' }],
			gateway3Info: { completionDate: new Date('2026-07-01') }
		})
	];
}
function initialiseTest(cases?: unknown[]) {
	const nunjucks = configureNunjucks();
	const mockRes = {
		render: mock.fn((view, data) => nunjucks.render(view, data)),
		status: mock.fn(function () {
			return mockRes;
		})
	};
	const mockReq = { session: { authenticatedEmail: 'user@example.com' }, params: {} };
	const logger = mockLogger();
	const db = {
		case: { findMany: mock.fn(async () => cases ?? buildTestCases()) }
	};
	const mockService = { logger, db };
	const landingPage = buildLandingPage(mockService);
	return { landingPage, mockRes, mockReq, db, nunjucks, logger };
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
		const { landingPage, mockRes, db, mockReq } = initialiseTest();
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));
		assert.strictEqual(db.case.findMany.mock.calls[0].arguments[0].where.email, 'user@example.com');
	});
	it('should render title and dynamic local planning authority caption', async () => {
		const cases = [mockCase({ reference: 'PLAN-001', lpas: [{ lpaName: 'Dynamic Borough Council' }] })];
		const { landingPage, mockRes, mockReq, nunjucks } = initialiseTest(cases);
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));
		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const expectedTitle = 'My plans';
		const expectedCaption = 'Dynamic Borough Council';
		assert.strictEqual(data.pageTitle, expectedTitle, `Expected ${expectedTitle} instead got ${data.pageTitle}`);
		assert.strictEqual(data.pageCaption, expectedCaption);
		assert.ok(html.includes(`<span class="govuk-caption-xl">${expectedCaption}</span>`));
	});
	it('should render plan data from service', async () => {
		const cases = [mockCase({ reference: 'PLAN-001', lpas: [{ lpaName: 'Southampton' }], planTitle: 'East plan' })];
		const { landingPage, mockRes, mockReq } = initialiseTest(cases);
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));
		const [, data] = mockRes.render.mock.calls[0].arguments;
		const refNum = data.plans[0][0].html.match(/>([^<]+)</)?.[1];
		assert.deepStrictEqual(refNum, 'PLAN-001', `Expected PLAN-001 instead got ${refNum}`);
		assert.strictEqual(data.plans[0][1].text, 'Southampton');
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
			['No case data found for user'],
			`Expected ["No case data found for user"] instead got ${loggerMessage}`
		);
		assert.strictEqual(data.noPlansFlag, true);
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
			'Reference number',
			'Lead local planning authority',
			'Plan title',
			'Current stage',
			'Status'
		];
		assert.deepStrictEqual(headings, expectedHeadings, `Expected ${expectedHeadings} instead got "${headings}"`);
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
	it('should render correct status tags', async () => {
		const { landingPage, mockRes, mockReq, nunjucks } = initialiseTest();
		await assert.doesNotReject(() => landingPage(mockReq, mockRes));
		const [view, data] = mockRes.render.mock.calls[0].arguments;
		const html = nunjucks.render(view, data);
		const targetTags = [
			{ className: 'govuk-tag govuk-tag--green', text: 'Ready to start' },
			{ className: 'govuk-tag govuk-tag--yellow', text: 'Under review' }
		];
		for (const plan of data.plans) {
			const rawTagClass = plan[4].html.match(/"([^"]+)"/)?.[1]; // 4 for last cell - where tag should be
			const rawTagText = plan[4].html.match(/>([^<]+)</)?.[1];
			assert.ok(
				targetTags.some((tag) => tag.className === rawTagClass && tag.text === rawTagText),
				`Expected one of ${JSON.stringify(targetTags)} but got ${rawTagClass}, ${rawTagText}`
			);
			assert.ok(
				html.includes(`<strong class="${rawTagClass}">${rawTagText}</strong>`),
				`expected <strong class="${rawTagClass}">${rawTagText}</strong>`
			);
		}
	});
});
