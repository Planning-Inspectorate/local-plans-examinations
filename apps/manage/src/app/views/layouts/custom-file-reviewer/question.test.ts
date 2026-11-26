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
	it('should expose formatted document groups in the view model', () => {
		const question = buildQuestion();
		const answer = [
			{
				category: 'permitted',
				documents: [
					{
						title: 'Statement of case',
						files: [{ fileName: 'statement.pdf', id: '1' }]
					},
					{ title: 'Plans', files: [] }
				]
			}
		];

		const viewModel = question.toViewModel({
			section: { name: 'Section' },
			journey: buildJourney(answer),
			params: { reference: 'PLAN-570791' }
		});

		assert.deepEqual(viewModel.question.value, answer);
		assert.deepEqual(viewModel.answer, answer);
		assert.deepEqual(viewModel.documentGroups, [
			{
				category: 'permitted',
				rows: [
					{
						key: { text: 'Statement of case' },
						value: {
							html: '<a class="govuk-link" href="/case/PLAN-570791/download-case-document/1">statement.pdf</a><br>'
						},
						actions: {
							items: [
								{
									href: '#',
									text: 'Manage',
									visuallyHiddenText: 'Statement of case'
								},
								{
									href: '#',
									text: 'Add',
									visuallyHiddenText: 'Statement of case'
								}
							]
						}
					},
					{
						key: { text: 'Plans' },
						value: { html: '<p class="govuk-body">Not provided</p>' },
						actions: {
							items: [
								{
									href: '#',
									text: 'Add',
									visuallyHiddenText: 'Plans'
								}
							]
						}
					}
				]
			}
		]);
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

	describe('workshop documents', () => {
		const submissionAnswer = [
			{
				category: 'procedural',
				documents: [
					{ title: 'Gateway 2 cover letter', files: [{ fileName: 'cover.pdf', id: 'cover' }] },
					{
						title: 'Workshop document',
						files: [
							{ fileName: 'workshop-1.pdf', id: 'workshop-1' },
							{ fileName: 'workshop-2.pdf', id: 'workshop-2' }
						]
					}
				]
			}
		];

		it('should not count workshop documents as submission documents', () => {
			const question = buildQuestion();
			const summary = question.formatAnswerForSummary('case', buildJourney(submissionAnswer), submissionAnswer);

			assert.equal(summary[0].value, '1 document(s)');
		});

		it('should keep the count in step with the rows shown on the review page', () => {
			const question = buildQuestion();
			const viewModel = question.toViewModel({
				section: { name: 'Section' },
				journey: buildJourney(submissionAnswer),
				params: { reference: 'PLAN-570791' }
			});
			const summary = question.formatAnswerForSummary('case', buildJourney(submissionAnswer), submissionAnswer);

			const rowTitles = viewModel.documentGroups.flatMap((group: any) => group.rows.map((row: any) => row.key.text));
			assert.deepEqual(rowTitles, ['Gateway 2 cover letter']);
			assert.doesNotMatch(JSON.stringify(viewModel.documentGroups), /workshop-\d\.pdf/);

			const filesShown = viewModel.documentGroups
				.flatMap((group: any) => group.rows)
				.reduce((total: number, row: any) => total + (row.value.html.match(/govuk-link/g)?.length ?? 0), 0);
			assert.equal(summary[0].value, `${filesShown} document(s)`);
		});

		it('should show zero documents and no Review action when only workshop documents are uploaded', () => {
			const question = buildQuestion();
			const answer = [
				{
					category: 'procedural',
					documents: [{ title: 'Workshop document', files: [{ fileName: 'workshop-1.pdf', id: 'workshop-1' }] }]
				}
			];

			const summary = question.formatAnswerForSummary('case', buildJourney(answer), answer);

			assert.deepEqual(summary, [{ key: 'Review files', value: '0 document(s)', action: undefined }]);
		});
	});
});
