import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseDate } from './date.ts';

describe('parseDate', () => {
	it('parses a valid date string', () => {
		assert.deepEqual(parseDate('26/08/2026'), new Date(Date.UTC(2026, 7, 26)));
	});

	it('throws when the date string is invalid', () => {
		assert.throws(() => parseDate('31/02/2026'), /Invalid date: 31\/02\/2026/);
	});
});
