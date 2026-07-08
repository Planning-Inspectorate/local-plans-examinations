import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { buildGetDeclarationPage, buildPostDeclarationPage } from './controller.ts';
import type { PortalService } from '#service';

const VIEW_PATH = 'views/gateway-2-application/application-declaration/application-declaration.njk';

function createReq(overrides: { params?: Record<string, string>; body?: Record<string, unknown> } = {}) {
	const req = {
		params: { reference: 'PLAN-123456', ...overrides.params },
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
		}
	} as unknown as Response;

	return { req, res, renderCalls, redirectCalls };
}

function createMockService() {
	const infoCalls: string[] = [];
	return {
		logger: {
			info(msg: string) {
				infoCalls.push(msg);
			}
		},
		infoCalls
	} as unknown as PortalService & { infoCalls: string[] };
}

describe('buildGetDeclarationPage', () => {
	it('renders the declaration page with correct view data', async () => {
		const handler = buildGetDeclarationPage();
		const { req, res, renderCalls } = createReq();

		await handler(req, res);

		assert.equal(renderCalls.length, 1);
		assert.equal(renderCalls[0][0], VIEW_PATH);
		const model = renderCalls[0][1] as Record<string, unknown>;
		assert.equal(model.pageTitle, 'Review declaration');
		assert.equal(model.pageHeading, 'Review declaration');
		assert.equal(model.pageCaption, 'Your application');
		assert.equal(model.backLinkUrl, '/manage-local-plans/PLAN-123456/gateway-2-application');
	});
});

describe('buildPostDeclarationPage', () => {
	it('redirects to application-complete when both checkboxes are checked', async () => {
		const service = createMockService();
		const handler = buildPostDeclarationPage(service);
		const { req, res, redirectCalls, renderCalls } = createReq({
			body: { declaration: ['informationTrue', 'privacyNotice'] }
		});

		await handler(req, res);

		assert.equal(redirectCalls.length, 1);
		assert.equal(redirectCalls[0], '/manage-local-plans/PLAN-123456/gateway-2-application/application-complete');
		assert.equal(renderCalls.length, 0);
	});

	it('renders error when no checkboxes are checked', async () => {
		const service = createMockService();
		const handler = buildPostDeclarationPage(service);
		const { req, res, redirectCalls, renderCalls } = createReq({
			body: {}
		});

		await handler(req, res);

		assert.equal(redirectCalls.length, 0);
		assert.equal(renderCalls.length, 1);
		assert.equal(renderCalls[0][0], VIEW_PATH);
		const model = renderCalls[0][1] as Record<string, unknown>;
		assert.ok(model.errorSummary);
		assert.ok(model.errors);
	});

	it('renders error when only informationTrue is checked', async () => {
		const service = createMockService();
		const handler = buildPostDeclarationPage(service);
		const { req, res, redirectCalls, renderCalls } = createReq({
			body: { declaration: ['informationTrue'] }
		});

		await handler(req, res);

		assert.equal(redirectCalls.length, 0);
		assert.equal(renderCalls.length, 1);
		const model = renderCalls[0][1] as Record<string, unknown>;
		assert.ok(model.errors);
	});

	it('renders error when only privacyNotice is checked', async () => {
		const service = createMockService();
		const handler = buildPostDeclarationPage(service);
		const { req, res, redirectCalls, renderCalls } = createReq({
			body: { declaration: ['privacyNotice'] }
		});

		await handler(req, res);

		assert.equal(redirectCalls.length, 0);
		assert.equal(renderCalls.length, 1);
		const model = renderCalls[0][1] as Record<string, unknown>;
		assert.ok(model.errors);
	});

	it('handles single checkbox value as a string (not array)', async () => {
		const service = createMockService();
		const handler = buildPostDeclarationPage(service);
		const { req, res, redirectCalls, renderCalls } = createReq({
			body: { declaration: 'informationTrue' }
		});

		await handler(req, res);

		assert.equal(redirectCalls.length, 0);
		assert.equal(renderCalls.length, 1);
		const model = renderCalls[0][1] as Record<string, unknown>;
		assert.ok(model.errors);
		const formValues = model.formValues as Record<string, boolean>;
		assert.equal(formValues.informationTrue, true);
		assert.equal(formValues.privacyNotice, false);
	});

	it('preserves checked state in formValues on error', async () => {
		const service = createMockService();
		const handler = buildPostDeclarationPage(service);
		const { req, res, renderCalls } = createReq({
			body: { declaration: ['informationTrue'] }
		});

		await handler(req, res);

		const model = renderCalls[0][1] as Record<string, unknown>;
		const formValues = model.formValues as Record<string, boolean>;
		assert.equal(formValues.informationTrue, true);
		assert.equal(formValues.privacyNotice, false);
	});

	it('error message matches acceptance criteria', async () => {
		const service = createMockService();
		const handler = buildPostDeclarationPage(service);
		const { req, res, renderCalls } = createReq({
			body: {}
		});

		await handler(req, res);

		const model = renderCalls[0][1] as Record<string, unknown>;
		const errorSummary = model.errorSummary as Array<{ text: string }>;
		assert.equal(errorSummary[0].text, 'You must confirm both declarations before you can submit your application.');
	});

	it('generates submission reference number on validation error', async () => {
		const service = createMockService();
		const handler = buildPostDeclarationPage(service);
		const { req, res, renderCalls } = createReq({
			body: {}
		});

		await handler(req, res);

		const model = renderCalls[0][1] as Record<string, unknown>;
		assert.ok(model.submissionReference);
		assert.equal(typeof model.submissionReference, 'string');
		assert.match(model.submissionReference as string, /^SUB-\d+-[A-Z0-9]{6}$/);
	});
});
