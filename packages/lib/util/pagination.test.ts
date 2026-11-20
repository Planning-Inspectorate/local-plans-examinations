import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPaginationDetails, getPaginationModel, type PaginationRequest } from './pagination.ts';

function createRequest(
	query: Record<string, unknown> = {},
	baseUrl = 'https://example.com',
	path = '/cases'
): PaginationRequest {
	return { baseUrl, path, query };
}

describe('getPaginationDetails', () => {
	it('calculates the current page and query offset', () => {
		assert.deepEqual(getPaginationDetails(10, '2', 3), {
			currentPage: 2,
			totalPages: 4,
			skip: 3,
			take: 3
		});
	});

	it('defaults invalid page values to the first page', () => {
		for (const value of [undefined, '0', '-1', '1.5', 'page', ['2', '3']]) {
			assert.equal(getPaginationDetails(10, value, 3).currentPage, 1);
		}
	});

	it('clamps a page beyond the available results to the final page', () => {
		assert.deepEqual(getPaginationDetails(7, '99', 3), {
			currentPage: 3,
			totalPages: 3,
			skip: 6,
			take: 3
		});
	});

	it('uses the first page when there are no results', () => {
		assert.deepEqual(getPaginationDetails(0, '2', 3), {
			currentPage: 1,
			totalPages: 0,
			skip: 0,
			take: 3
		});
	});

	it('rejects invalid totals and page sizes', () => {
		assert.throws(() => getPaginationDetails(-1, '1', 3), /totalItems/);
		assert.throws(() => getPaginationDetails(1, '1', 0), /pageSize/);
	});
});

describe('getPaginationModel', () => {
	it('returns no links for a single page', () => {
		assert.deepEqual(getPaginationModel(createRequest(), 1, 1), {
			previous: null,
			next: null,
			items: []
		});
	});

	it('generates page, previous and next links', () => {
		const pagination = getPaginationModel(createRequest(), 3, 2);

		assert.deepEqual(pagination, {
			previous: { href: 'https://example.com/cases?page=1' },
			next: { href: 'https://example.com/cases?page=3' },
			items: [
				{ number: 1, href: 'https://example.com/cases?page=1', current: false },
				{ number: 2, href: 'https://example.com/cases?page=2', current: true },
				{ number: 3, href: 'https://example.com/cases?page=3', current: false }
			]
		});
	});

	it('uses ellipses around pages in the middle of a large result set', () => {
		const pagination = getPaginationModel(createRequest(), 10, 5);

		assert.deepEqual(
			pagination.items.map((item) => ('ellipsis' in item ? 'ellipsis' : item.number)),
			[1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]
		);
	});

	it('preserves existing scalar and array query parameters', () => {
		const pagination = getPaginationModel(
			createRequest({ page: '1', search: 'local plan', status: ['open', 'closed'] }),
			3,
			1
		);

		assert.equal(pagination.next?.href, 'https://example.com/cases?search=local+plan&status=open&status=closed&page=2');
	});

	it('generates a query-only URL for a root route', () => {
		const pagination = getPaginationModel(createRequest({}, '', '/'), 2, 1);

		assert.equal(pagination.next?.href, '?page=2');
	});
});
