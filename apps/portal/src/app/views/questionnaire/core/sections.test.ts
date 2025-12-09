import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createSections } from './sections.ts';
import { MOCK_QUESTIONS } from '../test-utils.ts';

describe('QuestionnaireSections', () => {
	describe('createSections', () => {
		it('should create correct number of sections', () => {
			const sections = createSections(MOCK_QUESTIONS);

			assert.strictEqual(sections.length, 2);
		});

		it('should create Personal Information section with correct configuration', () => {
			const sections = createSections(MOCK_QUESTIONS);
			const personalSection = sections[0];

			assert.strictEqual(personalSection.name, 'Personal Information');
			assert.strictEqual(personalSection.segment, 'personal');
		});

		it('should create Experience section with correct configuration', () => {
			const sections = createSections(MOCK_QUESTIONS);
			const experienceSection = sections[1];

			assert.strictEqual(experienceSection.name, 'Your Experience');
			assert.strictEqual(experienceSection.segment, 'experience');
		});

		it('should add questions to Personal Information section', () => {
			const sections = createSections(MOCK_QUESTIONS);
			const personalSection = sections[0];

			assert.ok(personalSection.questions);
		});

		it('should add questions to Experience section', () => {
			const sections = createSections(MOCK_QUESTIONS);
			const experienceSection = sections[1];

			assert.ok(experienceSection.questions);
		});

		it('should configure conditional logic for email question', () => {
			const sections = createSections(MOCK_QUESTIONS);
			const personalSection = sections[0];
			const emailQuestion = personalSection.questions.find((q: any) => q.fieldName === 'email');

			assert.ok(emailQuestion, 'Email question should exist');
			assert.ok(typeof emailQuestion.shouldDisplay === 'function', 'Email should have conditional display function');
		});

		it('should show email when wantToProvideEmail is yes', () => {
			const sections = createSections(MOCK_QUESTIONS);
			const personalSection = sections[0];
			const emailQuestion = personalSection.questions.find((q: any) => q.fieldName === 'email');

			const mockResponse = { answers: { wantToProvideEmail: 'yes' } };
			const shouldDisplay = emailQuestion.shouldDisplay(mockResponse);
			assert.strictEqual(shouldDisplay, true);
		});

		it('should hide email when wantToProvideEmail is no', () => {
			const sections = createSections(MOCK_QUESTIONS);
			const personalSection = sections[0];
			const emailQuestion = personalSection.questions.find((q: any) => q.fieldName === 'email');

			const mockResponse = { answers: { wantToProvideEmail: 'no' } };
			const shouldDisplay = emailQuestion.shouldDisplay(mockResponse);
			assert.strictEqual(shouldDisplay, false);
		});

		it('should hide email when wantToProvideEmail is not answered', () => {
			const sections = createSections(MOCK_QUESTIONS);
			const personalSection = sections[0];
			const emailQuestion = personalSection.questions.find((q: any) => q.fieldName === 'email');

			const mockResponse = { answers: {} };
			const shouldDisplay = emailQuestion.shouldDisplay(mockResponse);
			assert.strictEqual(shouldDisplay, false);
		});

		it('should always show fullName regardless of answers', () => {
			const sections = createSections(MOCK_QUESTIONS);
			const personalSection = sections[0];
			const fullNameQuestion = personalSection.questions.find((q: any) => q.fieldName === 'fullName');

			const mockResponse = { answers: {} };
			const shouldDisplay = fullNameQuestion.shouldDisplay(mockResponse);
			assert.strictEqual(shouldDisplay, true, 'fullName should always display');
		});

		it('should always show wantToProvideEmail regardless of answers', () => {
			const sections = createSections(MOCK_QUESTIONS);
			const personalSection = sections[0];
			const wantEmailQuestion = personalSection.questions.find((q: any) => q.fieldName === 'wantToProvideEmail');

			const mockResponse = { answers: {} };
			const shouldDisplay = wantEmailQuestion.shouldDisplay(mockResponse);
			assert.strictEqual(shouldDisplay, true, 'wantToProvideEmail should always display');
		});

		it('should handle empty questions object gracefully', () => {
			assert.throws(() => {
				createSections({});
			}, /question is required/);
		});

		it('should maintain section order', () => {
			const sections = createSections(MOCK_QUESTIONS);

			assert.strictEqual(sections[0].name, 'Personal Information');
			assert.strictEqual(sections[1].name, 'Your Experience');
		});
	});
});
