import BaseValidator from '@planning-inspectorate/dynamic-forms/src/validator/base-validator.js';
import { body } from 'express-validator';

export default class FileUploadRequiredValidator extends BaseValidator {
	readonly fieldName: string;
	readonly errorMessage: string;

	constructor(fieldName: string, errorMessage = 'Upload a file') {
		super();
		this.fieldName = fieldName;
		this.errorMessage = errorMessage;
	}

	validate() {
		return [
			body(this.fieldName).custom((value) => {
				const decodedJson = Buffer.from(String(value ?? ''), 'base64').toString('utf-8');
				const parsed = JSON.parse(decodedJson);

				if (!Array.isArray(parsed) || parsed.length === 0) {
					throw new Error(this.errorMessage);
				}

				return true;
			})
		];
	}
}
