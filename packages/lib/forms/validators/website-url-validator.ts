import { RequiredValidator, type Question } from '@planning-inspectorate/dynamic-forms';
import { body } from 'express-validator';

const ALLOWED_WEBSITE_PREFIX = /^(?:https?:\/\/|www\.)/i;

/* eslint-disable camelcase -- validator.js defines its URL options using snake_case. */
const WEBSITE_URL_OPTIONS = {
	protocols: ['http', 'https'],
	require_protocol: false,
	require_valid_protocol: true,
	require_host: true,
	require_tld: true,
	allow_protocol_relative_urls: false,
	allow_underscores: false,
	disallow_auth: true
};
/* eslint-enable camelcase */

export class WebsiteUrlValidator extends RequiredValidator {
	constructor(errorMessage = 'Enter a valid link to your examination website') {
		super(errorMessage);
	}

	validate(question: Question) {
		return body(question.fieldName)
			.trim()
			.custom((value) => typeof value === 'string' && ALLOWED_WEBSITE_PREFIX.test(value))
			.withMessage(this.errorMessage)
			.bail()
			.isURL(WEBSITE_URL_OPTIONS)
			.withMessage(this.errorMessage);
	}
}
