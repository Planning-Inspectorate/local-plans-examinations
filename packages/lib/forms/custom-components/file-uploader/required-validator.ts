import { RequiredValidator } from '@planning-inspectorate/dynamic-forms';
import { body } from 'express-validator';

export default class FileUploadRequiredValidator extends RequiredValidator {
	readonly fieldName: string;

	constructor(fieldName: string, errorMessage = 'Upload a file') {
		super(errorMessage);
		this.fieldName = fieldName;
	}

	validate() {
		return body(this.fieldName).custom((value) => {
			const decodedJson = Buffer.from(String(value ?? ''), 'base64').toString('utf-8');
			const parsed = JSON.parse(decodedJson);

			if (!Array.isArray(parsed) || parsed.length === 0) {
				throw new Error(this.errorMessage);
			}

			return true;
		});
	}
}
