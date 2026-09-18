import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import type { Client } from '@microsoft/microsoft-graph-client';
import { sortGateway3Submissions } from './util.ts';

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
});
