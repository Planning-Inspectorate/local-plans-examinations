import assert from 'node:assert';
import { describe, it } from 'node:test';
import { formatDisplayDate } from './date.ts';

describe('formatDisplayDate', () => {
	it('formats a date for display', () => {
		assert.equal(formatDisplayDate(new Date('2026-09-02T12:00:00.000Z')), '2 September 2026');
	});

	it('returns undefined when the date is not set', () => {
		assert.equal(formatDisplayDate(null), undefined);
		assert.equal(formatDisplayDate(undefined), undefined);
	});
});
