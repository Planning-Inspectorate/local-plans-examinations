import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import type { Client } from '@microsoft/microsoft-graph-client';
import { sortGateway2Workshops, sortGateway3Submissions } from './util.ts';

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

	it('sortGateway2Workshops sorts dates without changing the input', () => {
		const workshops = [
			{ id: 'later', createdDate: '2026-02-01T00:00:00.000Z' },
			{ id: 'missing', createdDate: null },
			{ id: 'earlier', createdDate: new Date('2026-01-01T00:00:00.000Z') }
		];

		const sorted = sortGateway2Workshops(workshops as any);

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
