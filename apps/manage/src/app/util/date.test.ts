import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fromZonedTime } from 'date-fns-tz';
import { formatDateToString, parseDate } from './date.ts';

describe('parseDate', () => {
	it('parses a valid date string as a local-midnight date', () => {
		const parsed = parseDate('26/08/2026');
		assert.deepEqual(parsed, fromZonedTime('2026-08-26 00:00', 'Europe/London'));
		assert.equal(parsed.toISOString(), '2026-08-25T23:00:00.000Z');
	});

	it('parses an ISO date loaded from the database', () => {
		assert.deepEqual(parseDate('2026-12-12T00:00:00.000Z'), new Date('2026-12-12T00:00:00.000Z'));
	});

	it('throws when an ISO date string is invalid', () => {
		assert.throws(() => parseDate('not-a-date'), /Invalid date: not-a-date/);
	});

	it('throws when the date string is invalid', () => {
		assert.throws(() => parseDate('31/02/2026'), /Invalid date: 31\/02\/2026/);
	});

	it('formats a date in the Europe/London timezone', () => {
		assert.equal(formatDateToString(parseDate('7/10/2026')), '7 October 2026');
	});
});
