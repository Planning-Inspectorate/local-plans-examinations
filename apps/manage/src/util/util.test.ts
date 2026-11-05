import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import {
	getExaminationStages,
	sortByDateColumn,
	sortGateway3Submissions,
	type examinationStatusWithPause
} from './util.ts';
import type { ManageService } from '#service';

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
