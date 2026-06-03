import { createLpaOptions } from './journey.ts';
import assert from 'node:assert';
import { describe, it } from 'node:test';

describe('createLpaOptions', () => {
	it('should populate the lpaHistory object in the session', () => {
		const response = {
			answers: {
				checkLpas: [{ lpa: 'LPA1' }, { lpa: 'LPA2' }]
			},
			referenceId: '',
			journeyId: '',
			LPACode: ''
		};

		const questions = {
			lpa: {
				options: [
					{ value: 'LPA1', text: 'Local Planning Authority 1' },
					{ value: 'LPA2', text: 'Local Planning Authority 2' }
				]
			},
			contactDetails: {
				inputFields: [{ fieldName: 'lpaContact', options: [] }]
			}
		};

		const req = {
			session: {
				lpaHistory: []
			}
		} as any;

		createLpaOptions(response, questions, req);

		assert.deepStrictEqual(req.session.lpaHistory, ['Local Planning Authority 1', 'Local Planning Authority 2']);
	});

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

		const req = { session: {} } as any;

		createLpaOptions(response, questions, req);

		assert.strictEqual(questions.contactDetails.inputFields[0].options.length, 1);
		assert.deepStrictEqual(questions.contactDetails.inputFields[0].options[0], {
			value: 'Local Authority 1',
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

		const req = { session: {} } as any;

		createLpaOptions(response, questions, req);

		assert.strictEqual((response as any).answers.lpaContact, 'Local Authority 1');
	});

	it('should handle empty checkLpas', () => {
		const response = { answers: { checkLpas: [] }, referenceId: '', journeyId: '', LPACode: '' };
		const questions = {
			lpa: { options: [] },
			contactDetails: { inputFields: [{ fieldName: 'lpaContact', options: [] }] }
		};
		const req = { session: {} } as any;

		createLpaOptions(response, questions, req);

		assert.deepStrictEqual(req.session.lpaHistory, []);
	});

	it('should handle missing LPA text in options', () => {
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
		const req = { session: {} } as any;

		createLpaOptions(response, questions, req);

		assert.deepStrictEqual(req.session.lpaHistory, []);
	});
});
