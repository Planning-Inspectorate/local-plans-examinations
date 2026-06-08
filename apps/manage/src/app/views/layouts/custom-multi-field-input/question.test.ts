import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import CustomMultiFieldInputQuestion from './question.ts';
import type { QuestionViewModel } from '@planning-inspectorate/dynamic-forms';

const baseParams = {
	title: 'Contact details',
	fieldName: 'contactDetails',
	question: 'What are the main contact details for the Local Planning Authority?',
	url: 'contact-details',
	journeyId: 'create-a-case'
};

const buildQuestion = (overrides = {}) => {
	const question = new CustomMultiFieldInputQuestion({
		...baseParams,
		inputFields: [
			{ fieldName: 'firstName', label: 'First name' },
			{ fieldName: 'lastName', label: 'Last name', formatPrefix: 'Last: ' },
			{ fieldName: 'email', label: 'Email', value: 'joe.bloggs@example.com' },
			{ type: 'hidden', fieldName: 'hiddenMeta', value: 'abc123' }
		] as any,
		...overrides
	});

	question.getAction = () => ({ href: '/edit', text: 'Change', visuallyHiddenText: 'Contact details' });

	return question;
};

const buildJourneyWithAnswers = (answers = {}) => ({
	response: { answers }
});

describe('CustomMultiFieldInputQuestion', () => {
	it('should throw error when inputFields are missing', () => {
		assert.throws(
			() =>
				new CustomMultiFieldInputQuestion({
					...baseParams
				}),
			/inputFields are mandatory/
		);
	});

	it('should return values for input fields and preserve hidden fields', () => {
		const question = buildQuestion();
		const answers = {
			firstName: 'Joe',
			lastName: 'Bloggs',
			email: 'joe.bloggs@example.com',
			hiddenMeta: 'overwriting this value should have no effect'
		};
		const viewAnswers = question.answerForViewModel(answers);

		assert.deepEqual(viewAnswers, [
			{ fieldName: 'firstName', label: 'First name', value: 'Joe' },
			{ fieldName: 'lastName', label: 'Last name', formatPrefix: 'Last: ', value: 'Bloggs' },
			{ fieldName: 'email', label: 'Email', value: 'joe.bloggs@example.com' },
			{ type: 'hidden', fieldName: 'hiddenMeta', value: 'abc123' }
		]);
	});

	it('should apply formatTextFunction when provided and value exists', () => {
		const question = buildQuestion({
			inputFields: [
				{
					fieldName: 'firstName',
					label: 'First name',
					formatTextFunction: (value: any) => value.toUpperCase()
				}
			]
		});
		const result = question.answerForViewModel({ firstName: 'Alice' });
		assert.equal(result[0].value, 'ALICE');
		assert.equal(result[0].label, 'First name');
	});

	it('should not format falsy values', () => {
		const question = buildQuestion({
			inputFields: [
				{
					fieldName: 'firstName',
					label: 'First name',
					formatTextFunction: () => 'SHOULD_NOT_APPLY'
				}
			]
		});
		assert.equal(question.answerForViewModel({ firstName: '' })[0].value, '');
	});

	it('should set label and attributes in view model', () => {
		const question = buildQuestion({
			label: 'Enter your contact details',
			inputAttributes: { 'data-test': 'attr' }
		});
		const viewModel: QuestionViewModel = { question: {} };
		question.addCustomDataToViewModel(viewModel);
		assert.equal(viewModel.question.label, 'Enter your contact details');
		assert.deepEqual(viewModel.question.attributes, { 'data-test': 'attr' });
	});

	it('should trim string values and preserve non-string values when saving data', async () => {
		const question = buildQuestion({
			inputFields: [
				{ fieldName: 'name', label: 'Name' },
				{ fieldName: 'age', label: 'Age' }
			]
		});
		const request = { body: { name: '  Bob  ', age: 42 } };
		const result = await question.getDataToSave(request);
		assert.deepEqual(result, { answers: { name: 'Bob', age: 42 } });
	});

	it('should return not started when all unanswered', () => {
		const question = buildQuestion();
		question.notStartedText = 'Not started';

		const summary = question.formatAnswerForSummary('application', buildJourneyWithAnswers({}));
		assert.equal(summary[0].key, 'Contact details');
		assert.ok(String(summary[0].value).includes('Not started'));
		assert.deepEqual(summary[0].action, { href: '/edit', text: 'Change', visuallyHiddenText: 'Contact details' });
	});
});
