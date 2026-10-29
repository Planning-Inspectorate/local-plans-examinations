import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import CustomFileManagerQuestion from './question.ts';

const baseParams = {
	title: 'Documents',
	fieldName: 'documents',
	question: 'Documents',
	url: 'documents-manage',
	viewData: { uploadQuestionUrl: 'documents' }
};

const buildJourney = (answer: unknown) => ({
	response: { answers: { documents: answer } },
	journeyTemplate: 'test-template',
	taskListUrl: '/task-list',
	journeyTitle: 'Journey',
	getBackLink: () => '/back'
});

describe('CustomFileManagerQuestion', () => {
	it('exposes the uploaded files and upload question url in the view model', () => {
		const answer = [{ id: '1', fileName: 'report.pdf', metadata: { documentGuid: 'document-1' } }];
		const expectedDataRows = [
			[
				{
					html: '<a class="govuk-link" href="/case/PLAN-123456/download-case-document/document-1">report.pdf</a>'
				},
				{
					text: ''
				},
				{
					html: `<a class="govuk-link" href="documents/remove/1">Remove<span class="govuk-visually-hidden"> report.pdf + '</span></a>`
				}
			]
		];

		const viewModel = new CustomFileManagerQuestion(baseParams).toViewModel({
			section: { name: 'Section' },
			journey: buildJourney(answer),
			params: { reference: 'PLAN-123456' }
		});

		assert.deepEqual(viewModel.dataRows, expectedDataRows);
	});

	it('falls back to an empty list when no files are uploaded', () => {
		const viewModel = new CustomFileManagerQuestion(baseParams).toViewModel({
			section: { name: 'Section' },
			journey: buildJourney(undefined),
			params: {}
		});

		assert.deepEqual(viewModel.dataRows, []);
	});

	it('disables pending and infected downloads while keeping clean documents downloadable', () => {
		const answer = ['not_scanned', 'affected', 'scanned'].map((virusCheckStatus) => ({
			id: virusCheckStatus,
			fileName: `${virusCheckStatus}.pdf`,
			virusCheckStatus,
			metadata: { documentGuid: `document-${virusCheckStatus}` }
		}));
		const { dataRows } = new CustomFileManagerQuestion(baseParams).toViewModel({
			section: { name: 'Section' },
			journey: buildJourney(answer),
			params: { reference: 'PLAN-123456' }
		});

		assert.match(dataRows[0][0].html, /govuk-tag--yellow">Virus scanning/);
		assert.match(dataRows[1][0].html, /govuk-tag--red">Virus detected/);
		assert.match(dataRows[1][0].html, /affected.pdf contains a virus. Remove the file and upload a different version./);
		for (const row of dataRows.slice(0, 2)) assert.doesNotMatch(row[0].html, /href=/);
		assert.match(dataRows[2][0].html, /href="\/case\/PLAN-123456\/download-case-document\/document-scanned"/);
		assert.doesNotMatch(dataRows[2][0].html, /govuk-tag/);
	});
});
