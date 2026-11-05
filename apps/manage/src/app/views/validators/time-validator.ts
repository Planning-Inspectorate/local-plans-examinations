import BaseValidator from '@planning-inspectorate/dynamic-forms/src/validator/base-validator.js';
import { body } from 'express-validator';

export default class TimeValidator extends BaseValidator {
	validate({ fieldName }: { fieldName: string }) {
		return body(`${fieldName}_hour`)
			.custom((hour, { req }) => {
				const minute = req.body[`${fieldName}_minute`];
				return (
					typeof hour === 'string' &&
					typeof minute === 'string' &&
					/^(?:[01]?\d|2[0-3]):[0-5]?\d$/.test(`${hour}:${minute}`)
				);
			})
			.withMessage('Enter a valid time');
	}
}
