import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import CustomDocumentsQuestion, {
	DOCUMENT_LABELS,
	OPTIONAL_DOCUMENT_SETS,
	REQUIRED_DOCUMENT_SETS
} from './question.ts';

const REFERENCE = 'PLAN-123456';
const SUBMISSION_ID = '2';
const SUBMISSION_SECTION = `gateway-3-submission-${SUBMISSION_ID}`;
const SUBMISSION_URL = `/case/${REFERENCE}/gateway-3/${SUBMISSION_SECTION}`;
const EXAMINATION_WEBSITE = 'https://example.com/examination';
const NOT_ADDED = 'not added';

const requiredDocumentFields = Object.keys(REQUIRED_DOCUMENT_SETS);
const optionalDocumentFields = Object.keys(OPTIONAL_DOCUMENT_SETS);

const baseParams = {
	title: 'Documents',
	question: 'Gateway 3 Documents',
	fieldName: `gateway3DocumentSubmission-${SUBMISSION_ID}`,
	url: `gateway-3-review-documents-${SUBMISSION_ID}`
};

const buildQuestion = () => {
	const question = new CustomDocumentsQuestion(baseParams);
	question.getAction = () => ({ href: '/review', text: 'Review', visuallyHiddenText: 'Documents' });
	return question;
};

const withoutDocuments = (fields: string[]) => Object.fromEntries(fields.map((field) => [field, '']));

// Mirrors the shape compileGateway3Data returns: every document field is present, blank when nothing was added
const buildAnswers = ({
	optionalData = {},
	...requiredOverrides
}: Record<string, unknown> & { optionalData?: Record<string, string> } = {}) => ({
	...withoutDocuments(requiredDocumentFields),
	examinationWebsite: null,
	...requiredOverrides,
	optionalData: { ...withoutDocuments(optionalDocumentFields), ...optionalData }
});

const buildJourney = (answers: Record<string, unknown>) => ({
	response: { answers },
	journeyTemplate: 'test-template',
	taskListUrl: '/task-list',
	journeyTitle: 'Journey',
	getBackLink: () => '/back'
});

const buildViewModelOptions = (answers: Record<string, unknown>) => ({
	section: { name: 'Gateway 3 submission', segment: SUBMISSION_SECTION },
	journey: buildJourney(answers),
	params: { reference: REFERENCE, section: SUBMISSION_SECTION }
});

const reviewDocumentsHref = `${SUBMISSION_URL}/gateway-3-review-documents-${SUBMISSION_ID}`;

describe('CustomDocumentsQuestion', () => {
	describe('formatAnswerForSummary', () => {
		it('should count required, optional and examination website documents', () => {
			const question = buildQuestion();
			const answers = buildAnswers({
				proposedLocalPlan: 'plan.pdf, plan-appendix.pdf',
				mapOfPolicies: 'map.pdf',
				examinationWebsite: EXAMINATION_WEBSITE,
				optionalData: { otherDocuments: 'other.pdf' }
			});

			const summary = question.formatAnswerForSummary(SUBMISSION_SECTION, buildJourney(answers) as any);

			assert.deepEqual(summary, [
				{
					key: 'Documents',
					value: '5 document(s)',
					action: { href: '/review', text: 'Review', visuallyHiddenText: 'Documents' }
				}
			]);
		});

		it('should show zero documents when nothing has been added', () => {
			const question = buildQuestion();

			const [summaryRow] = question.formatAnswerForSummary(SUBMISSION_SECTION, buildJourney(buildAnswers()) as any);

			assert.equal(summaryRow.value, '0 document(s)');
		});
	});

	describe('setActionLink', () => {
		it('should link to the submission review documents page with Review text when documents have been added', () => {
			const question = buildQuestion();

			question.setActionLink(SUBMISSION_ID, REFERENCE, buildAnswers({ proposedLocalPlan: 'plan.pdf' }));

			assert.deepEqual(question.actionLink, { href: reviewDocumentsHref, text: 'Review' });
		});

		it('should leave the action text empty when no documents have been added', () => {
			const question = buildQuestion();

			question.setActionLink(SUBMISSION_ID, REFERENCE, buildAnswers());

			assert.deepEqual(question.actionLink, { href: reviewDocumentsHref, text: '' });
		});
	});

	describe('toViewModel', () => {
		it('should list the examination website first, then each required document by label', () => {
			const question = buildQuestion();
			const answers = buildAnswers({ proposedLocalPlan: 'plan.pdf', examinationWebsite: EXAMINATION_WEBSITE });

			const viewModel = question.toViewModel(buildViewModelOptions(answers));

			assert.deepEqual(
				Object.keys(viewModel.rowsMapRequiredData),
				['examinationWebsite', ...requiredDocumentFields].map((field) => DOCUMENT_LABELS[field])
			);
			assert.equal(viewModel.rowsMapRequiredData[DOCUMENT_LABELS.examinationWebsite], EXAMINATION_WEBSITE);
			assert.equal(viewModel.rowsMapRequiredData[DOCUMENT_LABELS.proposedLocalPlan], 'plan.pdf');
			assert.equal(viewModel.rowsMapRequiredData[DOCUMENT_LABELS.mapOfPolicies], NOT_ADDED);
		});

		it('should list each optional document by label and mark blank ones as not added', () => {
			const question = buildQuestion();
			const answers = buildAnswers({ optionalData: { environmentalReport: 'environmental-report.pdf' } });

			const viewModel = question.toViewModel(buildViewModelOptions(answers));

			assert.deepEqual(
				Object.keys(viewModel.optionDataMap),
				optionalDocumentFields.map((field) => DOCUMENT_LABELS[field])
			);
			assert.equal(viewModel.optionDataMap[DOCUMENT_LABELS.environmentalReport], 'environmental-report.pdf');
			assert.equal(viewModel.optionDataMap[DOCUMENT_LABELS.otherDocuments], NOT_ADDED);
		});

		it('should point Issue decision at the decision for the submission being reviewed', () => {
			const question = buildQuestion();

			const viewModel = question.toViewModel(buildViewModelOptions(buildAnswers()));

			assert.equal(viewModel.issueDecisionUrl, `${SUBMISSION_URL}/gateway-3-decision-${SUBMISSION_ID}`);
		});

		it('should set the Review action link for the submission being reviewed', () => {
			const question = buildQuestion();

			question.toViewModel(buildViewModelOptions(buildAnswers({ statementOfCompliance: 'compliance.pdf' })));

			assert.deepEqual(question.actionLink, { href: reviewDocumentsHref, text: 'Review' });
		});
	});
});
