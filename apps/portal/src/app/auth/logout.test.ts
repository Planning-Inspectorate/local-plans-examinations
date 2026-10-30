import assert from 'node:assert/strict';
import { it } from 'node:test';
import express from 'express';
import session from 'express-session';
import { TestServer } from '@planning-inspectorate/core/testing';
import { logout } from './logout.ts';

it('destroys the authenticated session and redirects to login', async (ctx) => {
	const app = express();
	app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
	app.get('/sign-in', (req, res) => {
		req.session.isAuthenticated = true;
		req.session.authenticatedEmail = 'user@example.com';
		req.session.forms = { 'PLAN-001': { journey: { answer: 'value' } } };
		res.sendStatus(204);
	});
	app.use('/logout', logout);
	app.get('/session', (req, res) => {
		res.json({
			isAuthenticated: req.session.isAuthenticated ?? false,
			authenticatedEmail: req.session.authenticatedEmail ?? null,
			forms: req.session.forms ?? null
		});
	});

	const server = new TestServer(app);
	await server.start();
	ctx.after(async () => await server.stop());
	const signIn = await server.get('/sign-in');
	const cookie = signIn.headers.getSetCookie()[0]?.split(';')[0];
	assert.ok(cookie);

	const logoutResponse = await fetch(`http://localhost:${server.port}/logout`, {
		headers: { cookie },
		redirect: 'manual'
	});
	assert.equal(logoutResponse.status, 302);
	assert.equal(logoutResponse.headers.get('location'), '/login');

	const response = await fetch(`http://localhost:${server.port}/session`, { headers: { cookie } });
	assert.deepEqual(await response.json(), {
		isAuthenticated: false,
		authenticatedEmail: null,
		forms: null
	});
});
