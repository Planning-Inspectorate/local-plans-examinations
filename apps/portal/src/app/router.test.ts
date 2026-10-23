import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { describe, it, mock, type TestContext } from 'node:test';
import express, { type Request } from 'express';
import { buildDefaultErrorHandlerMiddleware, notFoundHandler } from '@planning-inspectorate/core/middleware';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import type { PortalService } from '#service';
import { configureNunjucks } from './nunjucks.ts';
import { buildRouter } from './router.ts';
import { GW3_FILE_UPLOAD_QUESTIONS } from './views/manage-local-plans/gateway-3-submission/questions.ts';

process.env.SESSION_SECRET = 'router-test-secret';
process.env.GOV_NOTIFY_DISABLED = 'true';

const planReference = 'PLAN-001';
const planUrl = `/manage-local-plans/${planReference}`;
const gateway2Declaration = `${planUrl}/gateway-2-submission/application-declaration`;
const gateway3Declaration = `${planUrl}/gateway-3-submission/declaration`;
type Failure = 'ownership' | 'case' | 'document-sets' | 'documents' | 'transaction';

async function setup(t: TestContext, resubmission = false) {
	const previousDate = new Date('2026-09-01T00:00:00Z');
	const savedCase = {
		id: 'case-1',
		reference: planReference,
		planTitle: 'Saved local plan',
		submissionDate: resubmission ? previousDate : null,
		contacts: [{ email: 'lpa@example.test', lpa: { lpaCode: 'TEST', lpaName: 'Test LPA' } }],
		gateway2Info: { actualDate: null as Date | null },
		gateway3Info: {
			examinationWebsiteUrl: 'https://example.test/examination',
			actualDate: resubmission ? previousDate : null,
			submissions: resubmission
				? [
						{ decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED, completionDate: previousDate },
						{ decision: null, completionDate: null }
					]
				: []
		},
		documents: []
	};
	const documentSets = Object.values(GW3_FILE_UPLOAD_QUESTIONS).map((question) => ({
		id: question.url,
		folderName: question.url
	}));
	const documents = documentSets.map(({ id }) => ({
		guid: `guid-${id}`,
		name: `file-${id}`,
		documentSetId: id,
		isDeleted: false,
		isTemp: false,
		latestDocumentVersion: { version: 1, originalFilename: `${id}.pdf`, isDeleted: false }
	}));
	const session = {
		isAuthenticated: true,
		authenticatedEmail: 'lpa@example.test',
		forms: {
			[planReference]: {
				'gateway-2-submission': { planTitle: 'Saved local plan' },
				'gateway-3-submission': { examinationWebsite: savedCase.gateway3Info.examinationWebsiteUrl }
			}
		},
		fileUploader: {
			[`${planReference}:resubmissionDocuments:2`]: {
				uploadedFiles: [{ id: 'resubmission-file', fileName: 'updated-plan.pdf' }]
			}
		}
	};
	const state = {
		failure: undefined as Failure | undefined,
		ownsCase: true,
		missingCase: false,
		failAfterCommit: false,
		error: new Error('database unavailable')
	};
	function failAt(point: Failure) {
		if (state.failure === point) throw state.error;
	}
	const db = {
		case: {
			findFirst: mock.fn(async () => {
				failAt('ownership');
				return state.ownsCase ? structuredClone(savedCase) : null;
			}),
			findUnique: mock.fn(async () => {
				failAt('case');
				return state.missingCase ? null : structuredClone(savedCase);
			}),
			update: mock.fn((query: unknown) => query)
		},
		gateway2Info: { update: mock.fn((query: unknown) => query) },
		gateway3Info: { update: mock.fn((query: unknown) => query) },
		documentSet: {
			findMany: mock.fn(async () => {
				failAt('document-sets');
				return structuredClone(documentSets);
			})
		},
		document: {
			findMany: mock.fn(async ({ where }: { where: { documentSetId: string } }) => {
				failAt('documents');
				return structuredClone(documents.filter((document) => document.documentSetId === where.documentSetId));
			})
		},
		// Model Prisma's lazy writes: no state changes until the transaction succeeds.
		$transaction: mock.fn(async (queries: { data: { submissionDate?: Date; actualDate?: Date } }[]) => {
			failAt('transaction');
			savedCase.submissionDate = queries[0].data.submissionDate!;
			const info = db.gateway2Info.update.mock.callCount() ? savedCase.gateway2Info : savedCase.gateway3Info;
			info.actualDate = queries[1].data.actualDate!;
			return [];
		})
	};
	const notifyClient = { sendEmail: mock.fn(async () => ({})) };
	const service = {
		db,
		notifyClient,
		logger: { info: mock.fn(), warn: mock.fn(), error: mock.fn(), debug: mock.fn() }
	} as unknown as PortalService;
	const app = express();
	configureNunjucks().express(app);
	app.set('view engine', 'njk');
	app.use(express.urlencoded({ extended: true }));
	app.use((req, res, next) => {
		req.session = session as unknown as Request['session'];
		const redirect = res.redirect.bind(res);
		res.redirect = ((...args: Parameters<typeof redirect>) => {
			if (state.failAfterCommit && res.locals.submissionCompleted) throw new Error('redirect failed');
			return redirect(...args);
		}) as typeof res.redirect;
		next();
	});
	app.use(buildRouter(service));
	app.use(notFoundHandler);
	app.use(buildDefaultErrorHandlerMiddleware(service.logger));
	const server = app.listen(0, '127.0.0.1');
	t.after(() => {
		server.closeAllConnections();
		return new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
	});
	await once(server, 'listening');
	const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
	async function request(path: string, method = 'POST') {
		return fetch(baseUrl + path, {
			method,
			redirect: 'manual',
			body:
				method === 'POST'
					? new URLSearchParams([
							['declaration', 'informationTrue'],
							['declaration', 'privacyNotice']
						])
					: undefined
		});
	}
	return { state, session, savedCase, documents, db, notifyClient, request };
}

async function assertFailurePage(response: globalThis.Response) {
	assert.equal(response.status, 500);
	assert.equal(response.headers.get('location'), null);
	const html = await response.text();
	assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
	assert.match(html, /<h1[^>]*>Sorry, there is a problem with the service<\/h1>/);
	const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
	for (const copy of [
		"Something went wrong and your submission wasn't completed. Your answers have been saved.",
		'You can return to your plan and try again.',
		'Contact the Planning Inspectorate Customer Support if you have any questions:',
		'Phone: 0303 444 5000'
	]) {
		assert.ok(text.includes(copy), `Missing copy: ${copy}`);
	}
	assert.ok(html.includes(`href="${planUrl}"`));
	assert.ok(html.includes('href="tel:03034445000"'));
	assert.ok(!html.includes('database unavailable'));
}

describe('submission failure routing', () => {
	for (const journey of [
		{ name: 'Gateway 2', path: gateway2Declaration, failures: ['ownership', 'case', 'transaction'] },
		{
			name: 'Gateway 3',
			path: gateway3Declaration,
			failures: ['ownership', 'case', 'document-sets', 'documents', 'transaction']
		},
		{
			name: 'Gateway 3 resubmission',
			path: gateway3Declaration,
			failures: ['ownership', 'case', 'document-sets', 'documents', 'transaction']
		}
	]) {
		for (const failure of journey.failures) {
			it(`${journey.name}: shows the error page after ${failure} failure and permits retry with saved answers`, async (t) => {
				const context = await setup(t, journey.name === 'Gateway 3 resubmission');
				const { state, session, savedCase, documents, db, notifyClient, request } = context;
				const before = structuredClone({ savedCase, documents, forms: session.forms, uploads: session.fileUploader });
				if (journey.name === 'Gateway 3 resubmission') {
					const response = await request(`${planUrl}/gateway-3-resubmission`);
					assert.equal(response.status, 302);
					assert.equal(response.headers.get('location'), journey.path);
				}
				state.failure = failure as Failure;
				await assertFailurePage(await request(journey.path));
				assert.deepEqual(savedCase, before.savedCase);
				assert.deepEqual(documents, before.documents);
				assert.deepEqual(session.forms, before.forms);
				assert.deepEqual(
					session.fileUploader[`${planReference}:resubmissionDocuments:2`],
					before.uploads[`${planReference}:resubmissionDocuments:2`]
				);
				assert.equal(db.$transaction.mock.callCount(), failure === 'transaction' ? 1 : 0);
				assert.equal(notifyClient.sendEmail.mock.callCount(), 0);

				state.failure = undefined;
				assert.equal((await request(journey.path, 'GET')).status, 200);
				const retry = await request(journey.path);
				assert.equal(retry.status, 302);
				assert.equal(
					retry.headers.get('location'),
					journey.path === gateway2Declaration
						? `${planUrl}/gateway-2-submission/application-complete`
						: `${planUrl}/gateway-3-submission/submission-complete`
				);
				assert.ok(savedCase.submissionDate instanceof Date);
				assert.deepEqual(session.forms, before.forms);
			});
		}
	}

	for (const path of [gateway2Declaration, gateway3Declaration]) {
		it(`preserves login and ownership responses for ${path}`, async (t) => {
			const { session, state, db, request } = await setup(t);
			session.isAuthenticated = false;
			const login = await request(path);
			assert.equal(login.status, 302);
			assert.equal(login.headers.get('location'), '/login');
			assert.equal(db.case.findFirst.mock.callCount(), 0);
			session.isAuthenticated = true;
			state.ownsCase = false;
			const forbidden = await request(path);
			assert.equal(forbidden.status, 404);
			assert.ok(!(await forbidden.text()).includes('submission-failure-heading'));
			assert.equal(db.$transaction.mock.callCount(), 0);
		});

		it(`does not report a committed submission as failed for ${path}`, async (t) => {
			const { state, savedCase, request } = await setup(t);
			state.failAfterCommit = true;
			const response = await request(path);
			assert.equal(response.status, 500);
			assert.ok(savedCase.submissionDate instanceof Date);
			assert.ok(!(await response.text()).includes('submission-failure-heading'));
		});
	}

	it('preserves a missing Gateway 3 case response', async (t) => {
		const { state, request } = await setup(t);
		state.missingCase = true;
		assert.equal((await request(gateway3Declaration)).status, 404);
	});

	it('does not change errors on GETs, other POSTs or nested paths', async (t) => {
		const { state, request } = await setup(t);
		state.failure = 'ownership';
		for (const [path, method] of [
			[gateway2Declaration, 'GET'],
			[gateway3Declaration, 'GET'],
			[`${planUrl}/gateway-3-submission`, 'POST'],
			[`${gateway3Declaration}/other-page`, 'POST']
		]) {
			const response = await request(path, method);
			assert.equal(response.status, 500);
			assert.ok(!(await response.text()).includes('submission-failure-heading'));
		}
	});

	it('handles trailing slashes and query strings on final submissions', async (t) => {
		const { state, request } = await setup(t);
		state.failure = 'ownership';
		await assertFailurePage(await request(`${gateway3Declaration}/?from=declaration`));
	});
});
