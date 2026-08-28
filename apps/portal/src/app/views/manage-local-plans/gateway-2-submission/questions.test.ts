import assert from 'node:assert';
import { describe, it } from 'node:test';
import { appendQueryParam } from './questions.ts';

describe('appendQueryParam', () => {
	it('adds a query string with "?" when the url has no query', () => {
		assert.strictEqual(
			appendQueryParam('/plan-title', 'checkAnswersRedirect', 'check-your-answers'),
			'/plan-title?checkAnswersRedirect=check-your-answers'
		);
	});

	it('appends with "&" when the url already has a query string', () => {
		assert.strictEqual(
			appendQueryParam('/plan-title?foo=bar', 'checkAnswersRedirect', 'next-question'),
			'/plan-title?foo=bar&checkAnswersRedirect=next-question'
		);
	});

	it('URL-encodes the key', () => {
		assert.strictEqual(appendQueryParam('/x', 'a b', 'value'), '/x?a%20b=value');
	});

	it('URL-encodes the value', () => {
		assert.strictEqual(appendQueryParam('/x', 'redirect', 'a/b c&d'), '/x?redirect=a%2Fb%20c%26d');
	});

	it('encodes both key and value together', () => {
		assert.strictEqual(appendQueryParam('/x', 'a=b', 'c=d'), '/x?a%3Db=c%3Dd');
	});

	it('detects an existing query even when "?" is at the end', () => {
		assert.strictEqual(appendQueryParam('/x?', 'k', 'v'), '/x?&k=v');
	});

	it('handles empty key and value', () => {
		assert.strictEqual(appendQueryParam('/x', '', ''), '/x?=');
	});

	it('preserves the url fragment/path unchanged', () => {
		assert.strictEqual(
			appendQueryParam('/manage-local-plans/PLAN%2F123/gateway-2', 'checkAnswersRedirect', 'check-your-answers'),
			'/manage-local-plans/PLAN%2F123/gateway-2?checkAnswersRedirect=check-your-answers'
		);
	});

	it('appends multiple params sequentially', () => {
		const first = appendQueryParam('/x', 'a', '1');
		const second = appendQueryParam(first, 'b', '2');
		assert.strictEqual(second, '/x?a=1&b=2');
	});
});
