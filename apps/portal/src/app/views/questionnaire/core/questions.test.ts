import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createQuestionnaireQuestions } from '@pins/local-plans-questionnaire';

describe('QuestionnaireQuestions', () => {
	let questions: ReturnType<typeof createQuestionnaireQuestions>;

	describe('createQuestionnaireQuestions', () => {
		it('should create all required questions', () => {
			questions = createQuestionnaireQuestions();

			const expectedQuestions = ['fullName', 'wantToProvideEmail', 'email', 'rating', 'feedback'];
			expectedQuestions.forEach((questionKey) => {
				assert.ok(questions[questionKey], `Question ${questionKey} should exist`);
			});
		});

		it('should define exactly the expected questions with no extras', () => {
			questions = createQuestionnaireQuestions();

			const expectedQuestions = ['fullName', 'wantToProvideEmail', 'email', 'rating', 'feedback'];
			const actualQuestions = Object.keys(questions);

			assert.strictEqual(actualQuestions.length, expectedQuestions.length, 'Should have exact number of questions');
			expectedQuestions.forEach((questionKey) => {
				assert.ok(actualQuestions.includes(questionKey), `Missing required question: ${questionKey}`);
			});
			actualQuestions.forEach((questionKey) => {
				assert.ok(expectedQuestions.includes(questionKey), `Unexpected question found: ${questionKey}`);
			});
		});

		it('should configure fullName question correctly', () => {
			questions = createQuestionnaireQuestions();
			const fullName = questions.fullName;

			assert.strictEqual(fullName.viewFolder, 'single-line-input');
			assert.strictEqual(fullName.title, 'Full Name');
			assert.strictEqual(fullName.question, 'What is your full name?');
			assert.strictEqual(fullName.fieldName, 'fullName');
			assert.strictEqual(fullName.url, 'full-name');
			assert.ok(Array.isArray(fullName.validators));
			assert.ok(fullName.validators.length > 0);
		});

		it('should configure wantToProvideEmail question correctly', () => {
			questions = createQuestionnaireQuestions();
			const wantEmail = questions.wantToProvideEmail;

			assert.strictEqual(wantEmail.viewFolder, 'boolean');
			assert.strictEqual(wantEmail.title, 'Email Contact');
			assert.strictEqual(wantEmail.question, 'Would you like to provide your email address for updates?');
			assert.strictEqual(wantEmail.fieldName, 'wantToProvideEmail');
			assert.strictEqual(wantEmail.url, 'want-email');
			assert.ok(Array.isArray(wantEmail.validators));
		});

		it('should configure email question correctly', () => {
			questions = createQuestionnaireQuestions();
			const email = questions.email;

			assert.strictEqual(email.viewFolder, 'single-line-input');
			assert.strictEqual(email.title, 'Email Address');
			assert.strictEqual(email.question, 'What is your email address?');
			assert.strictEqual(email.fieldName, 'email');
			assert.strictEqual(email.url, 'email');
			assert.ok(Array.isArray(email.validators));
		});

		it('should configure rating question with options', () => {
			questions = createQuestionnaireQuestions();
			const rating = questions.rating;

			assert.strictEqual(rating.viewFolder, 'radio');
			assert.strictEqual(rating.title, 'Overall Rating');
			assert.strictEqual(rating.question, 'How would you rate your experience with the local plans service?');
			assert.strictEqual(rating.fieldName, 'rating');
			assert.strictEqual(rating.url, 'rating');
			assert.ok(Array.isArray(rating.validators));
			assert.ok(Array.isArray(rating.options));
			assert.strictEqual(rating.options.length, 4);

			const expectedOptions = ['excellent', 'good', 'average', 'poor'];
			rating.options.forEach((option: any, index: number) => {
				assert.strictEqual(option.value, expectedOptions[index]);
				assert.ok(option.text);
			});
		});

		it('should configure feedback question correctly', () => {
			questions = createQuestionnaireQuestions();
			const feedback = questions.feedback;

			assert.strictEqual(feedback.viewFolder, 'text-entry');
			assert.strictEqual(feedback.title, 'Feedback');
			assert.strictEqual(feedback.question, 'Please provide your feedback about the local plans service');
			assert.strictEqual(feedback.fieldName, 'feedback');
			assert.strictEqual(feedback.url, 'feedback');
			assert.ok(Array.isArray(feedback.validators));
		});

		it('should have validators for all questions', () => {
			questions = createQuestionnaireQuestions();

			Object.keys(questions).forEach((key) => {
				const question = questions[key];
				assert.ok(Array.isArray(question.validators), `${key} should have validators array`);
				assert.ok(question.validators.length > 0, `${key} should have at least one validator`);
			});
		});
	});
});
