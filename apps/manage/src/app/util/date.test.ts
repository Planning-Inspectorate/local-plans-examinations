import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseDate } from './date.ts';

describe('parseDate', () => {
	it('parses a valid date string as a local-midnight date', () => {
		const parsed = parseDate('26/08/2026');
		assert.deepEqual(parsed, new Date(2026, 7, 26));
		assert.equal(parsed.getHours(), 0);
	});

	it('throws when the date string is invalid', () => {
		assert.throws(() => parseDate('31/02/2026'), /Invalid date: 31\/02\/2026/);
	});
});
