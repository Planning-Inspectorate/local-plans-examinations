import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validationResult } from 'express-validator';
import CustomManageListValidator from './manage-list-validator.ts';

describe('CustomManageListValidator', () => {
	it('should pass when minimumAnswers is met using validate().run(req)', async () => {
		const validator = new CustomManageListValidator({
			minimumAnswers: 1,
			errorMessages: { minimumAnswers: 'At least one contact detail is required' }
		});
		const question = { fieldName: 'checkContactDetails' };

		const req = {
			res: {
				locals: {
					journeyResponse: {
						answers: {
							checkContactDetails: [{ firstName: 'Joe', lastName: 'Bloggs', email: 'joe.bloggs@example.com' }]
						}
					}
				}
			}
		};

		const chain = validator.validate(question);
		await chain.run(req);
		const result = validationResult(req);
		assert.equal(result.isEmpty(), true);
	});
});
