import { describe, it } from 'node:test';
import assert from 'node:assert';
import MultiFieldInputValidator from './multi-field-input-validator.ts';

describe('MultiFieldInputValidator', () => {
	it('throws when created without fields', () => {
		assert.throws(() => new MultiFieldInputValidator(), {
			message: 'MultiFieldInput validator is invoked without any fields'
		});
		assert.throws(() => new MultiFieldInputValidator({ fields: [] }), {
			message: 'MultiFieldInput validator is invoked without any fields'
		});
	});

	it('returns an empty rules array when fields contain no validators', () => {
		const validatorInstance = new MultiFieldInputValidator({
			fields: [{ fieldName: 'firstName' }, { fieldName: 'lastName', validators: [] }]
		});

		const rules = validatorInstance.validate();
		assert.deepStrictEqual(rules, []);
	});
});
