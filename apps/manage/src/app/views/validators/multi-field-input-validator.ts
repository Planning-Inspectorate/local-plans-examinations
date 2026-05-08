import BaseValidator from '@planning-inspectorate/dynamic-forms/src/validator/base-validator.js';
import type { ValidationChain } from 'express-validator';

interface Field {
	fieldName: string;
	validators?: any[];
}

/**
 * Validator for multi-field input components. This differs from the one in dynamic-forms
 * as it allows for any validator to be used on each individual field.
 */
export default class MultiFieldInputValidator extends BaseValidator {
	private fields: Field[];

	constructor({ fields } = { fields: [] as Field[] }) {
		super();

		if (!fields) throw new Error('MultiFieldInput validator is invoked without any fields');
		if (fields.length === 0) throw new Error('MultiFieldInput validator is invoked without any fields');

		this.fields = fields;
	}

	/**
	 * Validates response body against individual field validators.
	 * @returns {ValidationChain[]}
	 */
	validate(): ValidationChain[] {
		const rules: ValidationChain[] = [];

		for (const field of this.fields) {
			const { validators = [] } = field;

			this.runValidation(validators, field, rules);
		}

		return rules;
	}

	/**
	 * Runs validation for a given set of validators and pushes the resulting ValidationChains to the rules array.
	 * @param {BaseValidator[]} validators
	 * @param {Field} field
	 * @param {ValidationChain[]} rules
	 */
	private runValidation(validators: any[], field: Field, rules: ValidationChain[]) {
		for (const validator of validators) {
			if (validator instanceof MultiFieldInputValidator) {
				throw new Error('Nested MultiFieldInputValidators are not supported');
			}
			const result = validator.validate(field);

			if (result === undefined || result === null) {
				continue;
			}

			if (Array.isArray(result)) {
				rules.push(...result);
			} else {
				rules.push(result);
			}
		}
	}
}
