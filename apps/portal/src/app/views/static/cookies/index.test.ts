// @ts-nocheck

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import express from 'express';
import cookieParser from 'cookie-parser';
import { TestServer } from '@pins/local-plans-lib/testing/test-server.ts';
import { configureNunjucks } from '../../../nunjucks.ts';
import { createCookiesRoutes } from './index.ts';
import type { TestContext } from 'node:test';

const VALID_CONSENTS = ['accept', 'reject'] as const;

function createApp() {
	const app = express();
	app.use(express.urlencoded({ extended: true }));
	app.use(cookieParser());

	const nunjucksEnv = configureNunjucks();
	nunjucksEnv.express(app);
	app.set('view engine', 'njk');

	app.use('/', createCookiesRoutes());
	return app;
}

async function createTestServer(ctx: TestContext): Promise<TestServer> {
	const server = new TestServer(createApp(), { rememberCookies: true });
	await server.start();
	ctx.after(async () => await server.stop());
	return server;
}

/**
 * POST with URL-encoded form body (TestServer.post sends JSON by default)
 */
async function submitConsent(server: TestServer, analytics: string): Promise<Response> {
	return fetch(`http://localhost:${server.port}/cookies`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ analytics }).toString(),
		redirect: 'manual'
	});
}

function getConsentCookie(res: Response): string | undefined {
	return res.headers.getSetCookie().find((c) => c.startsWith('cookie_consent='));
}

function assertRedirectToUpdated(res: Response) {
	assert.equal(res.status, 302);
	assert.equal(res.headers.get('location'), '/cookies?updated=true');
}

describe('cookies routes', () => {
	describe('GET /cookies', () => {
		it('returns 200 and renders page', async (ctx) => {
			const server = await createTestServer(ctx);
			const res = await server.get('/cookies');
			assert.equal(res.status, 200);
			const html = await res.text();
			assert.ok(html.includes('Cookies'));
		});
	});

	describe('POST /cookies', () => {
		for (const consent of VALID_CONSENTS) {
			it(`redirects when analytics=${consent}`, async (ctx) => {
				const server = await createTestServer(ctx);
				const res = await submitConsent(server, consent);
				assertRedirectToUpdated(res);
			});

			it(`sets cookie_consent=${consent}`, async (ctx) => {
				const server = await createTestServer(ctx);
				const res = await submitConsent(server, consent);
				const cookie = getConsentCookie(res);
				assert.ok(cookie, 'cookie_consent cookie should be set');
				assert.ok(cookie.includes(`cookie_consent=${consent}`));
			});
		}

		it('does not set cookie for invalid value', async (ctx) => {
			const server = await createTestServer(ctx);
			const res = await submitConsent(server, 'invalid');
			const cookie = getConsentCookie(res);
			assert.equal(cookie, undefined, 'cookie_consent cookie should not be set');
		});

		it('sets cookie with SameSite=Strict', async (ctx) => {
			const server = await createTestServer(ctx);
			const res = await submitConsent(server, 'accept');
			const cookie = getConsentCookie(res);
			assert.ok(cookie?.includes('SameSite=Strict'));
		});

		it('sets cookie with 1-year expiry', async (ctx) => {
			const server = await createTestServer(ctx);
			const res = await submitConsent(server, 'accept');
			const cookie = getConsentCookie(res);
			assert.ok(cookie, 'cookie should be set');
			const expiresMatch = cookie.match(/Expires=([^;]+)/);
			assert.ok(expiresMatch, 'cookie should have Expires attribute');
			const expiresDate = new Date(expiresMatch[1]);
			const expected = new Date();
			expected.setFullYear(expected.getFullYear() + 1);
			const diff = Math.abs(expiresDate.getTime() - expected.getTime());
			assert.ok(diff < 10_000, `cookie expiry should be ~1 year from now, got ${diff}ms`);
		});
	});
});
