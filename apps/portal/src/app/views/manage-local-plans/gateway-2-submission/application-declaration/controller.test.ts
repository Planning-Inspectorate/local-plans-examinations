import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { buildGetDeclarationPage, buildPostDeclarationPage } from './controller.ts';
import { gateway2FileUploadQuestionConfigs } from '../controller.ts';
import type { PortalService } from '#service';
import { configureNunjucks } from '../../../../nunjucks.ts';

const VIEW_PATH = 'views/manage-local-plans/gateway-2-submission/application-declaration/application-declaration.njk';
process.env.SESSION_SECRET = 'not-a-real-secret';
process.env.GOV_NOTIFY_AUTH_CODE_TEMPLATE_ID = 'abc';
process.env.GOV_NOTIFY_GW2_SUBMISSION_TEMPLATE_ID = '123';
process.env.GOV_NOTIFY_API_KEY = 'xyz';
process.env.LOCAL_PLANS_TEAM_EMAIL = 'team@email.co.uk';

function createReq(overrides: { params?: Record<string, string>; body?: Record<string, unknown> } = {}) {
	const req = {
		params: { planReference: 'PLAN-123456', ...overrides.params },
		body: overrides.body ?? {}
	} as unknown as Request;

	const renderCalls: Array<[string, unknown?]> = [];
	const redirectCalls: string[] = [];

	const res = {
		render(view: string, model?: unknown) {
			renderCalls.push([view, model]);
			return this;
		},
		redirect(url: string) {
			redirectCalls.push(url);
			return this;
		},
		status(code: number) {
			return this;
		},
		send(body: unknown) {
			return this;
		}
	} as unknown as Response;

	return { req, res, renderCalls, redirectCalls };
}

function createMockService() {
	const infoCalls: string[] = [];
	const errorCalls: string[] = [];
	const sendCalls: Array<{ templateId: string; to: string; options?: unknown }> = [];

	return {
		logger: {
			info(msg: string) {
				infoCalls.push(msg);
			},
			error(msg: string) {
				errorCalls.push(msg);
			}
		},
		db: {
			case: {
				findUnique: async () => {
					return {
						id: 'case-1',
						contacts: [
							{
								email: 'lpa@example.com',
								lpa: { lpaCode: 'TEST', lpaName: 'Test Planning Authority' }
							}
						]
					};
				},
				update: mock.fn(async () => ({}))
			},
			gateway2Info: {
				update: mock.fn(async () => ({}))
			},
			documentSet: {
				findMany: mock.fn(async ({ where }: { where: { folderName: { in: string[] } } }) =>
					where.folderName.in.map((folderName) => ({ id: `ds-${folderName}`, folderName }))
				)
			},
			document: {
				updateMany: mock.fn(async () => ({ count: 0 }))
			},
			$transaction: mock.fn(async (queries: Promise<unknown>[]) => Promise.all(queries))
		},
		notifyClient: {
			sendEmail: async (templateId: string, to: string, options?: unknown) => {
				sendCalls.push({ templateId, to, options });
				return { id: 'mock-notify-id' };
			}
		},
		infoCalls,
		errorCalls,
		sendCalls
	} as unknown as PortalService & { infoCalls: string[]; errorCalls: string[]; sendCalls: any[] };
}

describe('buildGetDeclarationPage', () => {
	it('renders the declaration page with correct view data', async () => {
		const handler = buildGetDeclarationPage();
		const { req, res, renderCalls } = createReq();

		await handler(req, res);

		assert.equal(renderCalls.length, 1);
		assert.equal(renderCalls[0][0], VIEW_PATH);
		const model = renderCalls[0][1] as Record<string, unknown>;
		assert.equal(model.pageTitle, "Are you sure you're ready to submit?");
		assert.equal(model.pageHeading, "Are you sure you're ready to submit?");
		assert.equal(model.backLinkUrl, '/manage-local-plans/PLAN-123456/gateway-2-submission');
		assert.equal(model.goBackUrl, model.backLinkUrl);
	});

	it('renders the declaration confirmation content and return link', async () => {
		const { req, res, renderCalls } = createReq();
		await buildGetDeclarationPage()(req, res);

		const html = configureNunjucks().render(VIEW_PATH, {
			...(renderCalls[0][1] as Record<string, unknown>),
			_csrf: 'test-csrf-token',
			config: {
				styleFile: 'style.css',
				headerTitle: 'Submit your plan for examination',
				footerLinks: [],
				primaryNavigationLinks: []
			}
		});

		assert.ok(html.includes('Are you sure you&#39;re ready to submit?'));
		assert.ok(html.includes("This can't be undone."));
		assert.ok(html.includes('Yes, confirm submission'));
		assert.ok(html.includes('No, go back'));
		assert.ok(html.includes('href="/manage-local-plans/PLAN-123456/gateway-2-submission"'));
		assert.ok(html.includes('name="_csrf" value="test-csrf-token"'));
		assert.ok(!html.includes('type="checkbox"'));
	});
});

describe('buildPostDeclarationPage', () => {
	it('submits without checkbox input and redirects to confirmation', async (context) => {
		context.mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-09T12:00:00.000Z') });
		const service = createMockService();
		const handler = buildPostDeclarationPage(service);
		const { req, res, redirectCalls, renderCalls } = createReq();

		await handler(req, res);

		assert.equal(redirectCalls.length, 1);
		assert.equal(redirectCalls[0], '/manage-local-plans/PLAN-123456/gateway-2/confirmation');
		assert.equal(renderCalls.length, 0);

		assert.equal(service.sendCalls.length, 1);
		assert.equal(service.sendCalls[0].templateId, process.env.GOV_NOTIFY_GW2_SUBMISSION_TEMPLATE_ID);
		assert.equal(service.sendCalls[0].to, 'lpa@example.com');
		assert.deepEqual(service.sendCalls[0].options.personalisation, {
			planRef: 'PLAN-123456',
			authority_name: 'Test Planning Authority',
			contact_info: 'team@email.co.uk',
			planType: 'plan type',
			workshopWeekMonday: '11 November 2026',
			teamEmailAddress: 'team email address',
			teamPhone: 'team phone'
		});
		assert.equal(service.sendCalls[0].options.reference, 'gateway-2-submission:PLAN-123456');
	});

	it('commits the temporary Gateway 2 documents in the same transaction as the submission', async () => {
		const service = createMockService();
		const handler = buildPostDeclarationPage(service);
		const { req, res } = createReq();

		await handler(req, res);

		const db = service.db as any;
		const folderNames = gateway2FileUploadQuestionConfigs.map((questionConfig) => questionConfig.url);
		assert.deepEqual(db.documentSet.findMany.mock.calls[0].arguments[0].where.folderName.in, [...new Set(folderNames)]);
		assert.equal(db.$transaction.mock.callCount(), 1);
		assert.equal(db.$transaction.mock.calls[0].arguments[0].length, 3);
		const submissionDate = db.case.update.mock.calls[0].arguments[0].data.submissionDate;
		assert.ok(submissionDate instanceof Date);
		assert.deepEqual(db.gateway2Info.update.mock.calls[0].arguments[0], {
			where: { caseId: 'case-1' },
			data: { actualDate: submissionDate }
		});
		assert.deepEqual(db.document.updateMany.mock.calls[0].arguments[0], {
			where: {
				caseId: 'case-1',
				documentSetId: { in: [...new Set(folderNames)].map((folderName) => `ds-${folderName}`) },
				isTemp: true,
				isDeleted: false
			},
			data: { isTemp: false }
		});
	});

	it('returns 500 without submitting or emailing when the document set lookup fails', async () => {
		const service = createMockService();
		const db = service.db as any;
		db.documentSet.findMany.mock.mockImplementation(async () => []);
		const handler = buildPostDeclarationPage(service);
		const { req, res, redirectCalls } = createReq();
		const statusCalls: number[] = [];
		const sendCalls: unknown[] = [];
		res.status = ((code: number) => {
			statusCalls.push(code);
			return res;
		}) as Response['status'];
		res.send = ((body: unknown) => {
			sendCalls.push(body);
			return res;
		}) as Response['send'];

		await handler(req, res);

		assert.deepEqual(statusCalls, [500]);
		assert.deepEqual(sendCalls, ['Failed to record submission']);
		assert.equal(redirectCalls.length, 0);
		assert.equal(db.$transaction.mock.callCount(), 0);
		assert.equal(service.sendCalls.length, 0);
		assert.equal(service.errorCalls.length, 1);
	});
});
