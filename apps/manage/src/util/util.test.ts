import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import {
	compileExaminationDocumentFiles,
	getExaminationStages,
	getExaminingInspectorContacts,
	sortByDateColumn,
	sortGateway3Submissions,
	type examinationStatusWithPause
} from './util.ts';
import type { ManageService } from '#service';
import {
	EXAMINATION_OTHER_DOCUMENT_SETS,
	EXAMINATION_REQUIRED_DOCUMENT_SETS
} from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

describe('compileExaminationDocumentFiles', () => {
	it("loads only this case's saved examination documents and groups their latest filenames", async () => {
		const findMany = mock.fn(async (_query: unknown) => [
			{
				guid: 'plan-1',
				documentSetId: EXAMINATION_REQUIRED_DOCUMENT_SETS.localPlanSubmission,
				name: 'blob-1',
				latestDocumentVersion: { originalFilename: 'plan.pdf' }
			},
			{
				guid: 'plan-2',
				documentSetId: EXAMINATION_REQUIRED_DOCUMENT_SETS.localPlanSubmission,
				name: 'blob-2',
				latestDocumentVersion: { originalFilename: 'supporting-plan.pdf' }
			},
			{
				guid: 'report',
				documentSetId: EXAMINATION_OTHER_DOCUMENT_SETS.environmentalReport,
				name: 'report.pdf',
				latestDocumentVersion: null
			},
			{ guid: 'unrelated', documentSetId: 'g2-report', name: 'gw2.pdf', latestDocumentVersion: null }
		]);

		const result = await compileExaminationDocumentFiles({ document: { findMany } } as any, 'case-id');

		assert.deepEqual(findMany.mock.calls[0].arguments[0], {
			where: {
				caseId: 'case-id',
				isDeleted: false,
				isTemp: false,
				documentSetId: {
					in: [...Object.values(EXAMINATION_REQUIRED_DOCUMENT_SETS), ...Object.values(EXAMINATION_OTHER_DOCUMENT_SETS)]
				}
			},
			include: { latestDocumentVersion: true },
			orderBy: { createdAt: 'asc' }
		});
		assert.deepEqual(result, {
			localPlanSubmission: [
				{ guid: 'plan-1', fileName: 'plan.pdf' },
				{ guid: 'plan-2', fileName: 'supporting-plan.pdf' }
			],
			environmentalReport: [{ guid: 'report', fileName: 'report.pdf' }]
		});
	});

	it('returns no groups when there are no saved examination documents', async () => {
		const db = { document: { findMany: mock.fn(async () => []) } };
		assert.deepEqual(await compileExaminationDocumentFiles(db as any, 'case-id'), {});
	});
});

describe('test manage utilities', () => {
	it('sortGateway3Submissions returns the correct output', () => {
		const submissions = [
			{
				id: 'someId-1',
				decision: '1',
				completionDate: new Date(2025, 1, 1),
				gateway3InfoId: 'someId'
			},
			{
				id: 'someId-4',
				decision: '1',
				completionDate: null,
				gateway3InfoId: 'someId'
			},
			{
				id: 'someId-3',
				decision: '1',
				completionDate: new Date(2025, 3, 1),
				gateway3InfoId: 'someId'
			},
			{
				id: 'someId-2',
				decision: '1',
				completionDate: new Date(2025, 2, 1),
				gateway3InfoId: 'someId'
			}
		];
		const expectedSortedSubmissions = submissions.sort((a, b) => (a.id < b.id ? -1 : 1));
		const actualSortedSubmissions = sortGateway3Submissions(submissions);
		assert.deepEqual(actualSortedSubmissions, expectedSortedSubmissions);
	});

	it('sortByDateColumn sorts dates without changing the input', () => {
		const workshops = [
			{ id: 'later', createdDate: '2026-02-01T00:00:00.000Z' },
			{ id: 'missing', createdDate: null },
			{ id: 'earlier', createdDate: new Date('2026-01-01T00:00:00.000Z') }
		];

		const sorted = sortByDateColumn(workshops as any, 'createdDate');

		assert.deepEqual(
			sorted.map(({ id }) => id),
			['earlier', 'later', 'missing']
		);
		assert.deepEqual(
			workshops.map(({ id }) => id),
			['later', 'missing', 'earlier']
		);
	});
});

describe('getExaminationStages', () => {
	const CASE_ID = 'case-123';

	const buildRecord = (overrides: Partial<examinationStatusWithPause> = {}): examinationStatusWithPause => ({
		id: 'exam-1',
		examiningInspector1: 'inspector-1',
		examiningInspector2: null,
		examiningInspector3: null,
		QADate: null,
		qaInspector1: 'qa-1',
		qaInspector2: null,
		qaInspector3: null,
		panelResponseToInspectorDate: null,
		finalReportIssueDate: null,
		adoptionDate: null,
		planPauseHistory: [],
		...overrides
	});

	const mockService = (result: examinationStatusWithPause | null) => {
		const findFirst = mock.fn(async (_args: unknown) => result);
		const service = { db: { examinationInfo: { findFirst } } } as unknown as ManageService;
		return { service, findFirst };
	};

	it('queries examinationInfo by caseId with the expected select', async () => {
		const { service, findFirst } = mockService(buildRecord());

		await getExaminationStages(service, CASE_ID);

		assert.strictEqual(findFirst.mock.callCount(), 1);
		assert.deepStrictEqual(findFirst.mock.calls[0].arguments[0], {
			where: { caseId: CASE_ID },
			select: {
				id: true,
				examiningInspector1: true,
				examiningInspector2: true,
				examiningInspector3: true,
				QADate: true,
				qaInspector1: true,
				qaInspector2: true,
				qaInspector3: true,
				panelResponseToInspectorDate: true,
				finalReportIssueDate: true,
				adoptionDate: true,
				planPauseHistory: {
					orderBy: { createdAt: 'desc' },
					take: 1,
					select: { planPauseDate: true, planPauseEndDate: true }
				}
			}
		});
	});

	it('returns undefined when no examination record exists', async () => {
		const { service } = mockService(null);

		const result = await getExaminationStages(service, CASE_ID);

		assert.strictEqual(result, undefined);
	});

	it('returns the record with its original fields preserved', async () => {
		const record = buildRecord({ adoptionDate: new Date('2026-01-01') });
		const { service } = mockService(record);

		const result = await getExaminationStages(service, CASE_ID);

		assert.strictEqual(result, record);
		assert.strictEqual(result?.id, 'exam-1');
		assert.strictEqual(result?.examiningInspector1, 'inspector-1');
		assert.deepStrictEqual(result?.adoptionDate, new Date('2026-01-01'));
	});

	describe('shouldPause', () => {
		it('is false when there is no pause history', async () => {
			const { service } = mockService(buildRecord({ planPauseHistory: [] }));

			const result = await getExaminationStages(service, CASE_ID);

			assert.strictEqual(result?.shouldPause, false);
		});
	});

	it('propagates errors from the database', async () => {
		const findFirst = mock.fn(async () => {
			throw new Error('db down');
		});
		const service = { db: { examinationInfo: { findFirst } } } as unknown as ManageService;

		await assert.rejects(() => getExaminationStages(service, CASE_ID), { message: 'db down' });
	});
});

describe('getExaminingInspectorContacts', () => {
	type InspectorRequest = Parameters<typeof getExaminingInspectorContacts>[1];
	const request = { session: {} } as InspectorRequest;

	function createService(emails: Record<string, string | Error> = {}) {
		const entraClient = {
			getUserEmailFromId: mock.fn(async (id: string) => {
				const email = emails[id];
				if (email instanceof Error) throw email;
				return email ?? '';
			})
		};
		const service = {
			getEntraClient: mock.fn((_session: unknown) => entraClient),
			logger: { warn: mock.fn() }
		};

		return { service, entraClient };
	}

	it('returns the trimmed email of each assigned examining inspector in field order', async () => {
		const { service, entraClient } = createService({
			'inspector-1': ' one@example.com ',
			'inspector-3': 'three@example.com'
		});

		const result = await getExaminingInspectorContacts(service as unknown as ManageService, request, {
			examiningInspector3: 'inspector-3',
			examiningInspector1: 'inspector-1',
			examiningInspector2: null,
			status: 'not-an-inspector'
		});

		assert.deepStrictEqual(result, ['one@example.com', 'three@example.com']);
		assert.deepStrictEqual(
			entraClient.getUserEmailFromId.mock.calls.map(({ arguments: args }) => args[0]),
			['inspector-1', 'inspector-3']
		);
		assert.strictEqual(service.getEntraClient.mock.calls[0].arguments[0], request.session);
	});

	it('only returns the given inspectors when onlyInspectorIds is provided', async () => {
		const { service, entraClient } = createService({
			'inspector-1': 'one@example.com',
			'inspector-2': 'two@example.com'
		});

		const result = await getExaminingInspectorContacts(
			service as unknown as ManageService,
			request,
			{ examiningInspector1: 'inspector-1', examiningInspector2: 'inspector-2' },
			['inspector-2', 'not-an-examining-inspector']
		);

		assert.deepStrictEqual(result, ['two@example.com']);
		assert.deepStrictEqual(
			entraClient.getUserEmailFromId.mock.calls.map(({ arguments: args }) => args[0]),
			['inspector-2']
		);
	});

	it('ignores empty and non-string inspector ids', async () => {
		const { service, entraClient } = createService();

		const result = await getExaminingInspectorContacts(service as unknown as ManageService, request, {
			examiningInspector1: '',
			examiningInspector2: 123,
			examiningInspector3: undefined
		});

		assert.deepStrictEqual(result, []);
		assert.strictEqual(entraClient.getUserEmailFromId.mock.callCount(), 0);
	});

	it('skips inspectors whose email lookup fails or is blank and logs a warning', async () => {
		const lookupError = new Error('User not found');
		const { service } = createService({
			'inspector-1': lookupError,
			'inspector-2': '   ',
			'inspector-3': 'three@example.com'
		});

		const result = await getExaminingInspectorContacts(service as unknown as ManageService, request, {
			examiningInspector1: 'inspector-1',
			examiningInspector2: 'inspector-2',
			examiningInspector3: 'inspector-3'
		});

		assert.deepStrictEqual(result, ['three@example.com']);
		assert.strictEqual(service.logger.warn.mock.callCount(), 1);
		assert.deepStrictEqual(service.logger.warn.mock.calls[0].arguments, [
			{ error: lookupError, inspectorId: 'inspector-1' },
			'Could not look up examining inspector email in Entra'
		]);
	});

	it('returns an empty list when there is no examination info', async () => {
		const { service, entraClient } = createService();

		const result = await getExaminingInspectorContacts(service as unknown as ManageService, request, null);

		assert.deepStrictEqual(result, []);
		assert.strictEqual(entraClient.getUserEmailFromId.mock.callCount(), 0);
	});

	it('returns an empty list when there is no Entra client', async () => {
		const { service } = createService();
		service.getEntraClient.mock.mockImplementation(() => null);

		const result = await getExaminingInspectorContacts(service as unknown as ManageService, request, {
			examiningInspector1: 'inspector-1'
		});

		assert.deepStrictEqual(result, []);
	});
});
