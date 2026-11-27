import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import {
	addQaInspector,
	buildQaInspectorTabLocals,
	getQaInspectors,
	getQaInspectorUrls,
	removeQaInspector,
	clearQaInspectorDraft,
	getQaInspectorDraft,
	setQaInspectorDraft
} from './qa-inspector-helper.ts';

function createReq(session: Record<string, unknown> = {}) {
	return { session } as unknown as Parameters<typeof setQaInspectorDraft>[0];
}

function createDb() {
	const db = {
		case: { findUnique: mock.fn(async () => ({ id: 'case-1' })) },
		examinationInfo: {
			findUnique: mock.fn(async () => ({ id: 'exam-1', qaInspectors: [] })),
			findFirst: mock.fn(),
			upsert: mock.fn(async () => ({ id: 'exam-1' })),
			create: mock.fn()
		},
		qaInspector: { create: mock.fn(async () => ({})), delete: mock.fn(async () => ({})), findFirst: mock.fn() }
	};
	return db;
}

describe('qa-inspector-helper drafts', () => {
	it('stores name, appointed date and last edited question in the session', () => {
		const req = createReq();

		setQaInspectorDraft(req, 'LP-1', { name: 'Jane Inspector', appointedDate: '2026-11-24', lastEdited: 'date' });

		const draft = getQaInspectorDraft(req, 'LP-1');
		assert.equal(draft?.name, 'Jane Inspector');
		assert.equal(draft?.appointedDate, '2026-11-24');
		assert.equal(draft?.lastEdited, 'date');
	});

	it('keeps drafts for different cases separate', () => {
		const req = createReq();

		setQaInspectorDraft(req, 'LP-1', { name: 'First' });
		setQaInspectorDraft(req, 'LP-2', { name: 'Second' });

		assert.equal(getQaInspectorDraft(req, 'LP-1')?.name, 'First');
		assert.equal(getQaInspectorDraft(req, 'LP-2')?.name, 'Second');

		clearQaInspectorDraft(req, 'LP-1');

		assert.equal(getQaInspectorDraft(req, 'LP-1'), undefined);
		assert.equal(getQaInspectorDraft(req, 'LP-2')?.name, 'Second');
	});

	it('returns undefined when there is no draft', () => {
		const req = createReq();

		assert.equal(getQaInspectorDraft(req, 'LP-1'), undefined);
	});
});

describe('qa-inspector-helper urls', () => {
	it('builds the QA inspector urls off the examination tab', () => {
		const urls = getQaInspectorUrls('LP-001');

		assert.equal(urls.tabUrl, '/case/LP-001/examination');
		assert.equal(urls.questionUrl, '/case/LP-001/examination/qa-inspector/qa-inspector/who-is-the-qa-inspector');
		assert.equal(
			urls.dateUrl,
			'/case/LP-001/examination/qa-inspector/qa-inspector/when-was-the-qa-inspector-appointed'
		);
		assert.equal(urls.checkUrl, '/case/LP-001/examination/qa-inspector/check');
		assert.equal(urls.removeUrl, '/case/LP-001/examination/qa-inspector/remove');
	});
});

describe('qa-inspector-helper db operations', () => {
	it('returns no inspectors when the case has no examination', async () => {
		const db = createDb();
		db.examinationInfo.findUnique.mock.mockImplementation(async () => null);

		assert.deepEqual(await getQaInspectors(db as never, 'case-1'), []);
	});

	it('lists inspectors in the order they were added', async () => {
		const db = createDb();
		db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			id: 'exam-1',
			qaInspectors: [
				{ id: 'q2', name: 'Second', appointmentDate: new Date('2026-11-20'), createdDate: new Date('2026-11-02') },
				{ id: 'q1', name: 'First', appointmentDate: new Date('2026-11-01'), createdDate: new Date('2026-11-01') }
			]
		}));

		const inspectors = await getQaInspectors(db as never, 'case-1');
		assert.deepEqual(
			inspectors.map((inspector) => inspector.name),
			['First', 'Second']
		);
	});

	it('adds an inspector to the existing examination row', async () => {
		const db = createDb();
		db.examinationInfo.findUnique.mock.mockImplementation(async () => ({ id: 'exam-1', qaInspectors: [] }));
		db.qaInspector.create.mock.mockImplementation(async () => ({}));

		await addQaInspector(db as never, 'case-1', { name: 'Jane Inspector', appointmentDate: new Date('2026-11-24') });

		assert.equal(db.qaInspector.create.mock.callCount(), 1);
		const call = db.qaInspector.create.mock.calls[0].arguments[0];
		assert.deepEqual(call.data, {
			examinationInfoId: 'exam-1',
			name: 'Jane Inspector',
			appointmentDate: new Date('2026-11-24')
		});
	});

	it('creates the examination row when the case does not have one yet', async () => {
		const db = createDb();
		db.examinationInfo.findUnique.mock.mockImplementation(async () => null);
		db.examinationInfo.upsert.mock.mockImplementation(async () => ({ id: 'exam-new' }));
		db.qaInspector.create.mock.mockImplementation(async () => ({}));

		await addQaInspector(db as never, 'case-1', { name: 'Jane Inspector', appointmentDate: new Date() });

		const upsert = db.examinationInfo.upsert.mock.calls[0].arguments[0];
		assert.deepEqual(upsert.where, { caseId: 'case-1' });
		assert.deepEqual(upsert.create, { caseId: 'case-1' });
		const call = db.qaInspector.create.mock.calls[0].arguments[0];
		assert.equal(call.data.examinationInfoId, 'exam-new');
	});

	it('removes an inspector that belongs to the case examination', async () => {
		const db = createDb();
		db.examinationInfo.findUnique.mock.mockImplementation(async () => ({ id: 'exam-1' }));
		db.qaInspector.findFirst.mock.mockImplementation(async () => ({ id: 'q1', name: 'Jane Inspector' }));

		const removed = await removeQaInspector(db as never, 'case-1', 'q1');

		assert.equal(removed?.id, 'q1');
		assert.equal(db.qaInspector.delete.mock.callCount(), 1);
		assert.deepEqual(db.qaInspector.delete.mock.calls[0].arguments[0], { where: { id: 'q1' } });
	});

	it('returns null when the inspector does not belong to the case examination', async () => {
		const db = createDb();
		db.examinationInfo.findUnique.mock.mockImplementation(async () => ({ id: 'exam-1' }));
		db.qaInspector.findFirst.mock.mockImplementation(async () => null);

		const removed = await removeQaInspector(db as never, 'case-1', 'wrong-id');

		assert.equal(removed, null);
		assert.equal(db.qaInspector.delete.mock.callCount(), 0);
	});
});

describe('buildQaInspectorTabLocals', () => {
	it('builds numbered rows with remove links and the add link', async () => {
		const db = createDb();
		db.case.findUnique.mock.mockImplementation(async () => ({ id: 'case-1' }));
		db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			id: 'exam-1',
			qaInspectors: [
				{
					id: 'q1',
					name: 'Jane Inspector',
					appointmentDate: new Date('2026-11-24T00:00:00Z'),
					createdDate: new Date('2026-11-24T00:00:00Z')
				}
			]
		}));

		const locals = await buildQaInspectorTabLocals(db as never, 'LP-1');

		assert.equal(locals.qaInspectorLink, '/case/LP-1/examination/qa-inspector/qa-inspector/who-is-the-qa-inspector');
		assert.equal(locals.qaInspectors.length, 1);
		assert.deepEqual(locals.qaInspectors[0], {
			number: 1,
			name: 'Jane Inspector',
			appointedDate: '24 November 2026',
			removeLink: '/case/LP-1/examination/qa-inspector/remove/q1'
		});
	});
});
