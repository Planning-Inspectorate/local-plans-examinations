import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createQuestionnaireQuestions } from './questions.ts';

describe('Questionnaire Validator Configuration', () => {
	const questions = createQuestionnaireQuestions();

	describe('fullName configuration', () => {
		it('should have required validator', () => {
			assert.ok(questions.fullName.validators.length >= 1);
			const requiredValidator = questions.fullName.validators.find(
				(v: any) => v.errorMessage === 'Enter your full name'
			);
			assert.ok(requiredValidator, 'Should have required validator with correct message');
		});

		it('should have max length validator set to 250', () => {
			const stringValidator = questions.fullName.validators.find((v: any) => v.maxLength);
			assert.ok(stringValidator, 'Should have string validator');
			assert.strictEqual(stringValidator.maxLength.maxLength, 250);
			assert.ok(stringValidator.maxLength.maxLengthMessage.includes('250 characters'));
		});

		it('should have correct field configuration', () => {
			assert.strictEqual(questions.fullName.fieldName, 'fullName');
			assert.strictEqual(questions.fullName.title, 'Full Name');
			assert.strictEqual(questions.fullName.question, 'What is your full name?');
		});
	});

	describe('wantToProvideEmail configuration', () => {
		it('should have required validator', () => {
			assert.ok(questions.wantToProvideEmail.validators.length >= 1);
			const requiredValidator = questions.wantToProvideEmail.validators.find(
				(v: any) => v.errorMessage === 'Select yes or no'
			);
			assert.ok(requiredValidator, 'Should have required validator with correct message');
		});

		it('should be boolean type', () => {
			assert.strictEqual(questions.wantToProvideEmail.viewFolder, 'boolean');
		});
	});

	describe('email configuration', () => {
		it('should have required validator', () => {
			const requiredValidator = questions.email.validators.find(
				(v: any) => v.errorMessage === 'Enter your email address'
			);
			assert.ok(requiredValidator, 'Should have required validator');
		});

		it('should have email format validator', () => {
			const emailValidator = questions.email.validators.find(
				(v: any) => v.errorMessage && v.errorMessage.includes('correct format')
			);
			assert.ok(emailValidator, 'Should have email format validator');
			assert.ok(emailValidator.errorMessage.includes('name@example.com'));
		});
	});

	describe('rating configuration', () => {
		it('should have required validator', () => {
			const requiredValidator = questions.rating.validators.find((v: any) => v.errorMessage === 'Select a rating');
			assert.ok(requiredValidator, 'Should have required validator');
		});

		it('should have exactly 4 rating options', () => {
			assert.strictEqual(questions.rating.options.length, 4);
		});

		it('should have correct rating values', () => {
			const values = questions.rating.options.map((o: any) => o.value);
			assert.deepStrictEqual(values, ['excellent', 'good', 'average', 'poor']);
		});

		it('should be radio type', () => {
			assert.strictEqual(questions.rating.viewFolder, 'radio');
		});
	});

	describe('feedback configuration', () => {
		it('should have required validator', () => {
			const requiredValidator = questions.feedback.validators.find(
				(v: any) => v.errorMessage === 'Enter your feedback'
			);
			assert.ok(requiredValidator, 'Should have required validator');
		});

		it('should have max length validator set to 2000', () => {
			const stringValidator = questions.feedback.validators.find((v: any) => v.maxLength);
			assert.ok(stringValidator, 'Should have string validator');
			assert.strictEqual(stringValidator.maxLength.maxLength, 2000);
			assert.ok(stringValidator.maxLength.maxLengthMessage.includes('2000 characters'));
		});

		it('should be text-entry type', () => {
			assert.strictEqual(questions.feedback.viewFolder, 'text-entry');
		});
	});
});
