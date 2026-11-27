import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { IRouter } from 'express';
import { registerQaInspectorJourney } from './qa-inspector.ts';

const REFERENCE = 'LP-TEST-001';

function createDb() {
	const db = {
		case: {
			findUnique: mock.fn(async () => ({ id: 'case-1', planTitle: 'Some plan' })),
			update: mock.fn(async () => ({}))
		},
		examinationInfo: {
			findUnique: mock.fn(async () => ({ id: 'exam-1', qaInspectors: [] })),
			findFirst: mock.fn(),
			upsert: mock.fn(async () => ({ id: 'exam-1' })),
			update: mock.fn(async () => ({}))
		},
		qaInspector: {
			create: mock.fn(async () => ({})),
			delete: mock.fn(async () => ({})),
			findFirst: mock.fn(async () => null)
		}
	};
	return db as never as Record<string, any>;
}

function createService(db: Record<string, any>) {
	return { db, logger: { error: mock.fn(), info: mock.fn() } } as never;
}

/** register the journeys with a fake router to capture the registered route handlers */
function registerRoutes(
	service: Record<string, anyhow>
): Record<string, Array<(req: never, res: never, next?: never) => unknown>> {
	const routes = new Map<string, unknown[]>();
	const fakeRouter = {
		get: (...args: unknown[]) => routes.set(`GET ${args[0]}`, args.slice(1)),
		post: (...args: unknown[]) => routes.set(`POST ${args[0]}`, args.slice(1)),
		use: () => {
			/* not needed for this registration */
		}
	} as unknown as IRouter;
	registerQaInspectorJourney(fakeRouter, service as never);
	return Object.fromEntries(routes) as Record<string, Array<(req: never, res: never, next?: never) => unknown>>;
}

type anyhow = unknown;

let ROUTES: Record<string, Array<(req: never, res: never, next?: never) => unknown>>;

function createRes() {
	const res = {
		locals: {},
		status: mock.fn(() => res),
		render: mock.fn(),
		redirect: mock.fn()
	};
	return res as never as Record<string, any>;
}

/**
 * asyncHandler-wrapped middlewares resolve asynchronously, so wait until the handler
 * under test has produced its side effect (a render or a redirect) before asserting
 */
function waitForSideEffect(res: unknown) {
	const render = (res as unknown as { render: { mock: { callCount(): number } } }).render;
	const redirect = (res as unknown as { redirect: { mock: { callCount(): number } } }).redirect;
	const start = Date.now();
	return new Promise<void>((resolve, reject) => {
		const tick = () => {
			if (render.mock.callCount() > 0 || redirect.mock.callCount() > 0) {
				resolve();
			} else if (Date.now() - start > 1000) {
				reject(new Error('timed out waiting for the handler to render or redirect'));
			} else {
				setImmediate(tick);
			}
		};
		tick();
	});
}

async function runHandler(handlerPath: string, req: unknown, res: unknown) {
	const next = mock.fn();
	for (const handler of ROUTES[handlerPath]) {
		await handler(req as never, res as never, next as never);
	}
	await waitForSideEffect(res);
	return next;
}

describe('qa inspector check page (confirm details)', () => {
	it('renders Confirm QA inspector details with the draft answers and change links', async () => {
		const db = createDb();
		ROUTES = registerRoutes(createService(db));
		const res = createRes();
		const req = {
			params: { reference: REFERENCE },
			session: { qaInspectorDrafts: { [REFERENCE]: { name: 'Jane Inspector', appointedDate: '2026-11-24' } } }
		};

		await runHandler('GET /examination/qa-inspector/check', req, res);

		assert.equal(db.case.findUnique.mock.callCount(), 1);
		assert.equal(res.render.mock.callCount(), 1);
		const view = res.render.mock.calls[0].arguments[0];
		const locals = res.render.mock.calls[0].arguments[1];
		assert.equal(view, 'views/layouts/submit-documents-check-your-answers');
		assert.equal(locals.titleHeading, 'Confirm QA inspector details');
		assert.deepEqual(locals.answersToReview[0], {
			name: 'QA inspector',
			value: 'Jane Inspector',
			url: '/case/LP-TEST-001/examination/qa-inspector/qa-inspector/who-is-the-qa-inspector'
		});
		assert.equal(locals.answersToReview[1].name, 'Date appointed');
		assert.equal(
			locals.answersToReview[1].url,
			'/case/LP-TEST-001/examination/qa-inspector/qa-inspector/when-was-the-qa-inspector-appointed'
		);
		assert.equal(locals.submitButtonText, 'Save and continue');
	});

	it('defaults the appointment date to today when the draft has none', async () => {
		const db = createDb();
		ROUTES = registerRoutes(createService(db));
		const res = createRes();
		const req = {
			params: { reference: REFERENCE },
			session: { qaInspectorDrafts: { [REFERENCE]: { name: 'Jane Inspector' } } }
		};

		await runHandler('GET /examination/qa-inspector/check', req, res);

		const locals = res.render.mock.calls[0].arguments[1];
		const expected = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
		assert.equal(locals.answersToReview[1].value, expected);
	});

	it('redirects to the question page when no name was submitted', async () => {
		const db = createDb();
		ROUTES = registerRoutes(createService(db));
		const res = createRes();
		const req = { params: { reference: REFERENCE }, session: {} };

		await runHandler('GET /examination/qa-inspector/check', req, res);

		assert.equal(res.redirect.mock.callCount(), 1);
		assert.equal(
			res.redirect.mock.calls[0].arguments[0],
			'/case/LP-TEST-001/examination/qa-inspector/qa-inspector/who-is-the-qa-inspector'
		);
	});
});

describe('qa inspector confirm submission', () => {
	it('saves the inspector, records case history and returns to the examination tab', async () => {
		const db = createDb();
		ROUTES = registerRoutes(createService(db));
		const res = createRes();
		const appointedDate = new Date('2026-11-24');
		const req = {
			params: { reference: REFERENCE },
			body: {},
			session: { qaInspectorDrafts: { [REFERENCE]: { name: 'Jane Inspector', appointedDate: '2026-11-24' } } }
		};

		const next = await runHandler('POST /examination/qa-inspector/check', req, res);

		const created = db.qaInspector.create.mock.calls[0].arguments[0];
		assert.deepEqual(created.data, {
			examinationInfoId: 'exam-1',
			name: 'Jane Inspector',
			appointmentDate: appointedDate
		});
		// the draft is cleared so the same inspector cannot be added twice by refreshing
		assert.equal(req.session.qaInspectorDrafts[REFERENCE], undefined);
		assert.equal(res.redirect.mock.callCount(), 1);
		assert.equal(res.redirect.mock.calls[0].arguments[0], '/case/LP-TEST-001/examination');
	});

	it('does not save when there is no submitted name', async () => {
		const db = createDb();
		ROUTES = registerRoutes(createService(db));
		const res = createRes();
		const req = { params: { reference: REFERENCE }, body: {}, session: {} };

		await runHandler('POST /examination/qa-inspector/check', req, res);

		assert.equal(db.qaInspector.create.mock.callCount(), 0);
		assert.equal(res.redirect.mock.callCount(), 1);
	});
});

describe('qa inspector remove pages', () => {
	it('renders the remove confirmation with the inspector name', async () => {
		const db = createDb();
		db.qaInspector.findFirst.mock.mockImplementation(async () => null);
		db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			id: 'exam-1',
			qaInspectors: [{ id: 'qa-1', name: 'Jane Inspector', appointmentDate: new Date(), createdDate: new Date() }]
		}));
		ROUTES = registerRoutes(createService(db));
		const res = createRes();
		const req = { params: { reference: REFERENCE, qaInspectorId: 'qa-1' }, body: {}, session: {} };

		await runHandler('GET /examination/qa-inspector/remove/:qaInspectorId', req, res);

		assert.equal(res.render.mock.callCount(), 1);
		const view = res.render.mock.calls[0].arguments[0];
		const locals = res.render.mock.calls[0].arguments[1];
		assert.equal(view, 'views/layouts/remove-qa-inspector.njk');
		assert.equal(locals.qaInspectorName, 'Jane Inspector');
		assert.equal(locals.formAction, '/case/LP-TEST-001/examination/qa-inspector/remove/qa-1');
		assert.equal(locals.cancelLink, '/case/LP-TEST-001/examination');
	});

	it('returns to the examination tab when the inspector does not exist', async () => {
		const db = createDb();
		ROUTES = registerRoutes(createService(db));
		const res = createRes();
		const req = { params: { reference: REFERENCE, qaInspectorId: 'missing' }, body: {}, session: {} };

		await runHandler('GET /examination/qa-inspector/remove/:qaInspectorId', req, res);

		assert.equal(res.redirect.mock.callCount(), 1);
		assert.equal(res.redirect.mock.calls[0].arguments[0], '/case/LP-TEST-001/examination');
	});
});
