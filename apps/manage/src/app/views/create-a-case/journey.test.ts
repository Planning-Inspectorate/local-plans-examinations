import { createLpaOptions } from './journey.ts';
import assert from 'node:assert';
import { describe, it } from 'node:test';

describe('createLpaOptions', () => {
	it('should update lpaContact field options', () => {
		const response = {
			answers: {
				checkLpas: [{ lpa: 'lpa-1' }]
			},
			referenceId: '',
			journeyId: '',
			LPACode: ''
		};

		const questions = {
			lpa: {
				options: [{ value: 'lpa-1', text: 'Local Authority 1' }]
			},
			contactDetails: {
				inputFields: [{ fieldName: 'lpaContact', options: [] }]
			}
		};

		createLpaOptions(response, questions);

		assert.strictEqual(questions.contactDetails.inputFields[0].options.length, 1);
		assert.deepStrictEqual(questions.contactDetails.inputFields[0].options[0], {
			value: 'lpa-1',
			text: 'Local Authority 1'
		});
	});

	it('should auto-fill lpaContact when single LPA exists', () => {
		const response = {
			answers: {
				checkLpas: [{ lpa: 'lpa-1' }]
			},
			referenceId: '',
			journeyId: '',
			LPACode: ''
		};

		const questions = {
			lpa: {
				options: [{ value: 'lpa-1', text: 'Local Authority 1' }]
			},
			contactDetails: {
				inputFields: [{ fieldName: 'lpaContact', options: [] }]
			}
		};

		createLpaOptions(response, questions);

		assert.strictEqual((response as any).answers.lpaContact, 'lpa-1');
	});

	it('should not set lpaContact when checkLpas is empty', () => {
		const response = { answers: { checkLpas: [] }, referenceId: '', journeyId: '', LPACode: '' };
		const questions = {
			lpa: { options: [] },
			contactDetails: { inputFields: [{ fieldName: 'lpaContact', options: [] }] }
		};

		createLpaOptions(response, questions);

		assert.strictEqual((response as any).answers.lpaContact, undefined);
		assert.deepStrictEqual(questions.contactDetails.inputFields[0].options, []);
	});

	it('should ignore LPAs with no matching option', () => {
		const response = {
			answers: { checkLpas: [{ lpa: 'unknown-lpa' }] },
			referenceId: '',
			journeyId: '',
			LPACode: ''
		};
		const questions = {
			lpa: { options: [{ value: 'lpa-1', text: 'Local Authority 1' }] },
			contactDetails: {
				inputFields: [{ fieldName: 'lpaContact', options: [] }]
			}
		};

		createLpaOptions(response, questions);

		assert.strictEqual((response as any).answers.lpaContact, undefined);
		assert.deepStrictEqual(questions.contactDetails.inputFields[0].options, []);
	});

	it('should not auto-fill lpaContact when multiple LPAs exist', () => {
		const response = {
			answers: {
				checkLpas: [{ lpa: 'lpa-1' }, { lpa: 'lpa-2' }]
			},
			referenceId: '',
			journeyId: '',
			LPACode: ''
		};
		const questions = {
			lpa: {
				options: [
					{ value: 'lpa-1', text: 'Local Authority 1' },
					{ value: 'lpa-2', text: 'Local Authority 2' }
				]
			},
			contactDetails: {
				inputFields: [{ fieldName: 'lpaContact', options: [] }]
			}
		};

		createLpaOptions(response, questions);

		assert.strictEqual(questions.contactDetails.inputFields[0].options.length, 2);
		assert.strictEqual((response as any).answers.lpaContact, undefined);
	});
});
