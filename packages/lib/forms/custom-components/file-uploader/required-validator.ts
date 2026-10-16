import { RequiredValidator } from '@planning-inspectorate/dynamic-forms';
import { body } from 'express-validator';

export default class FileUploadRequiredValidator extends RequiredValidator {
	readonly fieldName: string;
	readonly requiredForJourney: boolean;

	constructor(fieldName: string, errorMessage = 'Choose a file to upload', { requiredForJourney = true } = {}) {
		super(errorMessage);
		this.fieldName = fieldName;
		this.requiredForJourney = requiredForJourney;
	}

	// Journey completion reads this; false still validates the page but leaves the answer optional.
	isRequired() {
		return this.requiredForJourney;
	}

	validate() {
		return body(this.fieldName).custom((value) => {
			const decodedJson = value ? Buffer.from(String(value ?? ''), 'base64').toString('utf-8') : '';
			const parsed = decodedJson ? JSON.parse(decodedJson) : decodedJson;

			if (!Array.isArray(parsed) || parsed.length === 0) {
				throw new Error(this.errorMessage);
			}

			return true;
		});
	}
}
