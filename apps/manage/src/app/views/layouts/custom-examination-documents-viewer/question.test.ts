import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import CustomExaminationDocumentsQuestion from './question.ts';
import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

const REVIEW_URL = '/case/PLAN-123456/examination/examination/examination-documents';

const buildQuestion = () =>
	new CustomExaminationDocumentsQuestion({
		title: 'Documents',
		question: 'Examination documents',
		fieldName: 'examinationDocuments',
		url: 'examination-documents'
	});

const buildJourney = (answers: Record<string, unknown>) =>
	({
		response: { answers },
		getCurrentQuestionUrl: () => REVIEW_URL
	}) as any;

const files = (...fileNames: string[]) => fileNames.map((fileName, index) => ({ guid: `guid-${index}`, fileName }));

describe('CustomExaminationDocumentsQuestion', () => {
	describe('formatAnswerForSummary', () => {
		it('should show a Review link once documents have been submitted', () => {
			const [row] = buildQuestion().formatAnswerForSummary(
				'examination',
				buildJourney({
					status: EXAMINATION_STATUS_ID.SUBMITTED,
					examinationDocumentFiles: {
						localPlanSubmission: files('plan.pdf'),
						environmentalReport: files('report-1.pdf', 'report-2.pdf')
					}
				})
			);

			assert.equal(row.key, 'Documents');
			assert.equal(row.value, '3 document(s)');
			assert.deepEqual(row.action, { href: REVIEW_URL, text: 'Review', visuallyHiddenText: 'Documents' });
		});

		it('should not show a Review link while the submission is still in progress', () => {
			const [row] = buildQuestion().formatAnswerForSummary(
				'examination',
				buildJourney({
					status: EXAMINATION_STATUS_ID.IN_PROGRESS,
					examinationDocumentFiles: { localPlanSubmission: files('plan.pdf') }
				})
			);

			assert.equal(row.value, '1 document(s)');
			assert.equal(row.action, undefined);
		});

		it('should not show a Review link when there are no documents', () => {
			const [row] = buildQuestion().formatAnswerForSummary(
				'examination',
				buildJourney({ status: EXAMINATION_STATUS_ID.SUBMITTED })
			);

			assert.equal(row.value, '0 document(s)');
			assert.equal(row.action, undefined);
		});
	});

	describe('toViewModel', () => {
		const buildViewModel = (answers: Record<string, unknown>) =>
			buildQuestion().toViewModel({
				section: { name: 'Examination', segment: 'examination' },
				journey: {
					...buildJourney(answers),
					journeyTemplate: 'test-template',
					taskListUrl: '/task-list',
					journeyTitle: 'Journey',
					getBackLink: () => '/back'
				},
				params: { reference: 'PLAN-123456', section: 'examination' }
			}) as any;
		const websiteLinkFor = (answers: Record<string, unknown>) =>
			buildViewModel(answers).documentGroups.find((group: any) => group.id === 'required-documents').websiteLink;

		it('shows the examination website the Examination tab resolved rather than reading a column itself', () => {
			const websiteLink = websiteLinkFor({
				// What the Examination tab shows: resolved from the database on every page load
				examinationWebsite: 'www.resolved-by-the-tab.example',
				// Raw columns on the examination row must not be picked here, or the two screens can disagree
				examinationWebsiteUrl: 'www.raw-column.example'
			});

			assert.equal(websiteLink.text, 'www.resolved-by-the-tab.example');
			assert.equal(websiteLink.href, 'https://www.resolved-by-the-tab.example');
		});

		it('keeps the scheme when the examination website already has one', () => {
			const websiteLink = websiteLinkFor({ examinationWebsite: 'http://www.example.com/examination' });

			assert.equal(websiteLink.href, 'http://www.example.com/examination');
		});

		it('has no examination website link when no address has been saved', () => {
			assert.equal(websiteLinkFor({ examinationWebsite: null }), undefined);
		});

		it('lists the uploaded documents under the Required and Other headings with download links', () => {
			const { documentGroups } = buildViewModel({
				examinationDocumentFiles: {
					localPlanSubmission: files('plan.pdf'),
					environmentalReport: files('report.pdf')
				}
			});

			assert.deepEqual(
				documentGroups.map((group: any) => group.heading),
				['Required', 'Other']
			);
			const filesIn = (group: any) => group.documents.flatMap((document: any) => document.files);
			assert.deepEqual(filesIn(documentGroups[0]), [
				{ fileName: 'plan.pdf', downloadUrl: '/case/PLAN-123456/download-case-document/guid-0' }
			]);
			assert.deepEqual(filesIn(documentGroups[1]), [
				{ fileName: 'report.pdf', downloadUrl: '/case/PLAN-123456/download-case-document/guid-0' }
			]);
		});
	});
});
