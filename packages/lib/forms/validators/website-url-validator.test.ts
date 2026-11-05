import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Question } from '@planning-inspectorate/dynamic-forms';
import { validationResult } from 'express-validator';
import { WebsiteUrlValidator } from './website-url-validator.ts';

const question = { fieldName: 'examinationWebsiteUrl' } as Question;

async function validate(value: string) {
	const request = { body: { examinationWebsiteUrl: value } };
	await new WebsiteUrlValidator().validate(question).run(request);
	return { request, result: validationResult(request) };
}

describe('WebsiteUrlValidator', () => {
	it('marks the examination website as required for journey completion', () => {
		assert.equal(new WebsiteUrlValidator().isRequired(), true);
	});

	for (const websiteUrl of [
		'https://www.example.gov.uk',
		'http://example.com',
		'www.example.com',
		'https://example.com/examination-library?document=1#documents'
	]) {
		it(`accepts ${websiteUrl}`, async () => {
			const { result } = await validate(websiteUrl);

			assert.equal(result.isEmpty(), true);
		});
	}

	for (const websiteUrl of [
		'',
		'example.com',
		'https://',
		'https://not a website.com',
		'https://invalid-domain',
		'ftp://example.com',
		'javascript:alert(1)',
		'https://user:password@example.com'
	]) {
		it(`rejects ${websiteUrl || 'an empty value'}`, async () => {
			const { result } = await validate(websiteUrl);

			assert.equal(result.isEmpty(), false);
			assert.equal(result.array()[0].msg, 'Enter a valid link to your examination website');
		});
	}

	it('trims surrounding whitespace before validation and persistence', async () => {
		const { request, result } = await validate('  www.example.gov.uk/examination  ');

		assert.equal(result.isEmpty(), true);
		assert.equal(request.body.examinationWebsiteUrl, 'www.example.gov.uk/examination');
	});
});
