import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { buildGetApplicationCompletePage } from './controller.ts';
import { configureNunjucks } from '../../../../nunjucks.ts';
import type { PortalService } from '#service';

const VIEW_PATH = 'views/manage-local-plans/gateway-2-submission/application-complete/index.njk';

function initialiseTest(
	caseRecord: { gateway2Info: { actualDate: Date | null } | null } | null = {
		gateway2Info: { actualDate: new Date('2026-11-04T12:00:00.000Z') }
	}
) {
	const mockReq = {
		params: { planReference: 'PLAN-001' }
	};
	const mockRes = {
		render: mock.fn((_view: string, _data: Record<string, unknown>) => {}),
		status: mock.fn((_code: number) => mockRes),
		send: mock.fn((_body: string) => {})
	};
	const mockService = {
		db: { case: { findUnique: mock.fn(async (_query: unknown) => caseRecord) } },
		logger: { error: mock.fn() }
	};
	const applicationCompletePage = buildGetApplicationCompletePage(mockService as unknown as PortalService);

	return { applicationCompletePage, mockReq, mockRes, mockService };
}

async function renderPage(submissionDate: Date | null = new Date('2026-11-04T12:00:00.000Z')) {
	const context = initialiseTest({ gateway2Info: { actualDate: submissionDate } });
	await context.applicationCompletePage(context.mockReq as Request, context.mockRes as unknown as Response);
	const [view, data] = context.mockRes.render.mock.calls[0].arguments;
	const html = configureNunjucks().render(view, {
		...data,
		config: {
			styleFile: 'style.css',
			headerTitle: 'Submit your plan for examination',
			footerLinks: [],
			primaryNavigationLinks: []
		}
	});

	return { ...context, view, data, html };
}

describe('buildGetApplicationCompletePage', () => {
	it('renders the application complete page with correct view data', async () => {
		const { mockRes, mockService, view, data } = await renderPage();

		assert.equal(mockRes.render.mock.callCount(), 1);
		assert.equal(view, VIEW_PATH);
		assert.deepEqual(data, {
			pageTitle: 'Gateway 2 submission complete',
			returnToPlanUrl: '/manage-local-plans/PLAN-001',
			workshopWeekMonday: '6 November 2026'
		});
		assert.deepEqual(mockService.db.case.findUnique.mock.calls[0].arguments[0], {
			where: { reference: 'PLAN-001' },
			select: {
				gateway2Info: {
					select: {
						actualDate: true
					}
				}
			}
		});
	});

	it('renders confirmation details with a link back to the plan', async () => {
		const { html } = await renderPage();

		assert.ok(html.includes('govuk-panel--confirmation'));
		assert.ok(html.includes('Gateway 2 submission complete'));
		assert.ok(html.includes("We've sent you a confirmation email."));
		assert.ok(html.includes('What happens next'));
		assert.ok(html.includes('An assessor will be appointed to your case in the next few days'));
		assert.ok(html.includes('2 consecutive days in the week beginning 6 November 2026'));
		assert.ok(html.includes('let you know whether this workshop will be online or in-person'));
		assert.ok(html.includes('contact you if they need further information before or after the workshop'));
		assert.ok(html.includes('They will usually send the assessment report within 2 weeks of the workshop'));
		assert.ok(html.includes('href="/manage-local-plans/PLAN-001"'));
		assert.ok(html.includes('check your submission status'));
	});

	it('shows that the workshop week is to be confirmed when no submission date is set', async () => {
		const { html } = await renderPage(null);

		assert.ok(html.includes('2 consecutive days in the week beginning to be confirmed'));
	});

	it('renders page not found when the case does not exist', async () => {
		const { applicationCompletePage, mockReq, mockRes } = initialiseTest(null);

		await applicationCompletePage(mockReq as Request, mockRes as unknown as Response);

		assert.equal(mockRes.status.mock.calls[0].arguments[0], 404);
		assert.equal(mockRes.render.mock.calls[0].arguments[0], 'views/layouts/error');
		assert.equal(mockRes.send.mock.callCount(), 0);
	});

	it('logs database errors and returns an error response', async () => {
		const { applicationCompletePage, mockReq, mockRes, mockService } = initialiseTest();
		const error = new Error('Database unavailable');
		mockService.db.case.findUnique.mock.mockImplementation(async () => {
			throw error;
		});

		await applicationCompletePage(mockReq as Request, mockRes as unknown as Response);

		assert.equal(mockService.logger.error.mock.callCount(), 1);
		assert.equal(mockRes.status.mock.calls[0].arguments[0], 500);
		assert.equal(mockRes.send.mock.calls[0].arguments[0], 'Failed to retrieve Gateway 2 submission date');
		assert.equal(mockRes.render.mock.callCount(), 0);
	});
});
