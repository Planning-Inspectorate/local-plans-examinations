import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { caseAccessWhere } from './case-access.ts';

describe('caseAccessWhere', () => {
	it('matches non-deleted cases by primary email or any contact email', () => {
		assert.deepStrictEqual(caseAccessWhere('second.contact@example.com'), {
			deletedDate: null,
			OR: [{ email: 'second.contact@example.com' }, { contacts: { some: { email: 'second.contact@example.com' } } }]
		});
	});
});
