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
});
