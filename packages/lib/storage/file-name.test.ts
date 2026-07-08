import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitiseFileName } from './file-name.ts';

describe('sanitiseFileName', () => {
	it('replaces invalid filename characters with underscores', () => {
		const fileName = sanitiseFileName('cover?letter:/final*.pdf');

		assert.equal(fileName, 'cover_letter__final_.pdf');
	});

	it('replaces control characters with underscores', () => {
		const fileName = sanitiseFileName('cover\u0000letter\nfinal.pdf');

		assert.equal(fileName, 'cover_letter_final.pdf');
	});

	it('trims whitespace from the sanitised filename', () => {
		const fileName = sanitiseFileName('  cover letter.pdf  ');

		assert.equal(fileName, 'cover letter.pdf');
	});
});
