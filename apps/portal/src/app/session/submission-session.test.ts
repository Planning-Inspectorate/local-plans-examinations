import assert from 'node:assert/strict';
import { it } from 'node:test';
import { markEditingFromCheckAnswers } from './submission-session.ts';

it('marks editing without changing other case or journey state', () => {
	const forms = { 'PLAN-001': { journey: { answer: 'one' } }, 'PLAN-002': { journey: { answer: 'two' } } };
	const session: { forms: typeof forms; editingFromCheckAnswers?: boolean } = { forms };

	markEditingFromCheckAnswers(session);

	assert.deepEqual(session, {
		forms: { 'PLAN-001': { journey: { answer: 'one' } }, 'PLAN-002': { journey: { answer: 'two' } } },
		editingFromCheckAnswers: true
	});
});
