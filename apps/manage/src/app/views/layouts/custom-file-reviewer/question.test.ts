import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import CustomFileReviewerQuestion from './question.ts';

const baseParams = {
	title: 'Review files',
	fieldName: 'reviewFiles',
	question: 'Review files',
	url: 'review-files',
	journeyId: 'case-review'
};

const buildQuestion = () => {
	const question = new CustomFileReviewerQuestion(baseParams);
	question.getAction = () => ({ href: '/review', text: 'Change', visuallyHiddenText: 'Review files' });
	return question;
};

const buildJourney = (answer: unknown) => ({
	response: { answers: { reviewFiles: answer } },
	journeyTemplate: 'test-template',
	taskListUrl: '/task-list',
	journeyTitle: 'Journey',
	getBackLink: () => '/back'
});

describe('CustomFileReviewerQuestion', () => {
	it('should expose the uploaded document groups in the view model', () => {
		const question = buildQuestion();
		const answer = [
			{
				category: 'permitted',
				documents: [
					{ title: 'Statement of case', files: [{ fileName: 'statement.pdf', id: '1' }] },
					{ title: 'Plans', files: [] }
				]
			}
		];

		const viewModel = question.toViewModel({
			section: { name: 'Section' },
			journey: buildJourney(answer),
			params: {}
		});

		assert.deepEqual(viewModel.question.value, answer);
		assert.deepEqual(viewModel.answer, answer);
		assert.deepEqual(viewModel.documentGroups, answer);
	});

	it('should count all files across groups and use the Review action text', () => {
		const question = buildQuestion();
		const answer = [
			{
				category: 'permitted',
				documents: [
					{
						title: 'Permitted',
						files: [
							{ fileName: 'a.pdf', id: 'a' },
							{ fileName: 'b.pdf', id: 'b' }
						]
					},
					{ title: 'Other', files: [{ fileName: 'c.pdf', id: 'c' }] }
				]
			}
		];

		const summary = question.formatAnswerForSummary('case', buildJourney(answer), answer);

		assert.deepEqual(summary, [
			{
				key: 'Review files',
				value: '3 document(s)',
				action: {
					href: '/review',
					text: 'Review',
					visuallyHiddenText: 'Review files'
				}
			}
		]);
	});

	it('should show zero documents and no action when there are no uploaded files', () => {
		const question = buildQuestion();
		const summary = question.formatAnswerForSummary('case', buildJourney([]), []);

		assert.deepEqual(summary, [{ key: 'Review files', value: '0 document(s)', action: undefined }]);
	});

	it('should default to an empty document group list when the answer is not an array', () => {
		const question = buildQuestion();
		const viewModel = question.toViewModel({
			section: { name: 'Section' },
			journey: buildJourney('not-an-array' as any),
			params: {}
		});

		assert.deepEqual(viewModel.documentGroups, []);
	});
});
