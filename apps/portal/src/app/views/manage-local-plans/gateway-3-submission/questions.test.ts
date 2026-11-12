import assert from 'node:assert';
import { describe, it } from 'node:test';
import { GW3QUESTIONS, GW3_REQUIRED_FILE_UPLOAD_QUESTIONS, REQUIRED_GATEWAY_3_ITEM_TITLES } from './questions.ts';

const expectedQuestions = {
	statementOfCompliance: {
		title: 'Statement of compliance',
		question: 'Upload your statement of compliance',
		caption: 'Procedural documents'
	},
	statementOfSoundness: {
		title: 'Statement of soundness',
		question: 'Upload your statement of soundness',
		caption: 'Procedural documents'
	},
	gateway2IssuesSummary: {
		title: 'Summary of how Gateway 2 assessor issues have been addressed',
		question: 'Upload your summary of how Gateway 2 assessor issues have been addressed',
		caption: 'Procedural documents'
	},
	changesSinceConsultationStatement: {
		title:
			'Statement explaining changes since the proposed local plan consultation, reasons for changes, any additional consultations',
		question:
			'Upload your statement explaining changes since the proposed local plan consultation, reasons for changes, any additional consultation',
		caption: 'Procedural documents'
	},
	consultationProposedPlanSummary: {
		title: 'Summary of consultation on proposed local plan',
		question: 'Upload your summary of consultation on proposed local plan',
		caption: 'Procedural documents'
	},
	representationsProgressSummary: {
		title: 'Summary of representations and responses on meeting prescribed requirements',
		question: 'Upload your summary of representations and responses on meeting prescribed requirements',
		caption: 'Consultation documents'
	},
	copiesOfRepresentations: {
		title: 'Representations',
		question: 'Upload representations',
		caption: 'Consultation documents'
	},
	consultationEngagementSummary: {
		title: 'Summary of consultation and engagement activities in preparing the proposed local plan',
		question: 'Upload your summary of consultation and engagement activities in preparing the proposed local plan',
		caption: 'Consultation documents'
	},
	scopingConsultationSummary: {
		title: 'Summary of scoping consultation',
		question: 'Upload your summary of scoping consultation',
		caption: 'Consultation documents'
	},
	consultationContentEvidenceSummary: {
		title: 'Summary of consultation on proposed local plan content and evidence',
		question: 'Upload your summary of consultation on proposed local plan content and evidence',
		caption: 'Consultation documents'
	},
	proposedLocalPlan: {
		title: 'Proposed local plan submission for examination',
		question: 'Upload your proposed local plan submission for examination',
		caption: 'Plan content, evidence and background'
	},
	examinationWebsite: {
		title: 'Examination website',
		question: 'Add a link to your examination website',
		caption: 'Plan content and evidence documents'
	},
	practicalArrangementsStatement: {
		title: 'Practical arrangements demonstrating readiness for examination',
		question: 'Upload your practical arrangements demonstrating readiness for examination',
		caption: 'Plan content, evidence and background'
	},
	environmentalReport: {
		title: 'Environmental report',
		question: 'Upload your environmental report',
		caption: 'Plan content, evidence and background'
	},
	statementOfReasonsDetermination: {
		title: 'Statement demonstrating that the proposed local plan is unlikely to have significant environmental effects',
		question:
			'Upload your statement demonstrating that the proposed local plan is unlikely to have significant environmental effects',
		caption: 'Plan content, evidence and background'
	},
	otherDocuments: {
		title: 'Supporting material',
		question: 'Upload your supporting material',
		caption: 'Plan content, evidence and background'
	},
	mapOfPolicies: {
		title: 'Map of proposed local plan policies',
		question: 'Upload your map of proposed local plan policies',
		caption: 'Plan content, evidence and background'
	},
	supplementaryPlansStatement: {
		title: 'Supplementary plans statement',
		question: 'Upload your supplementary plans statement page',
		caption: 'Plan content, evidence and background'
	}
} as const;

describe('Gateway 3 questions', () => {
	it('uses the acceptance-criteria titles, headings and captions', () => {
		for (const [key, expected] of Object.entries(expectedQuestions)) {
			const question = GW3QUESTIONS[key] as {
				title: string;
				question: string;
				text: { caption: string };
			};
			assert.ok(question, `expected question ${key}`);
			assert.strictEqual(question.title, expected.title);
			assert.strictEqual(question.question, expected.question);
			assert.strictEqual(question.text.caption, expected.caption);
		}
	});

	it('uses the required upload-page copy', () => {
		for (const [key, question] of Object.entries(GW3QUESTIONS)) {
			if (key === 'examinationWebsite') continue;
			const text = (question as { text: Record<string, string> }).text;
			assert.strictEqual(text.introduction, 'Upload a file');
			assert.strictEqual(text.chooseFilesButtonText, 'Choose files');
			assert.strictEqual(text.dropInstructionText, 'or drop files');
			assert.strictEqual(text.continueButtonText, 'Save and return');
			assert.strictEqual(
				text.fileRequirementsText,
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.'
			);
		}
	});

	it('marks only the ten required submission items as required', () => {
		assert.deepStrictEqual(REQUIRED_GATEWAY_3_ITEM_TITLES, [
			'Examination website',
			'Proposed local plan submission for examination',
			'Map of proposed local plan policies',
			'Statement of compliance',
			'Statement of soundness',
			'Summary of consultation and engagement activities in preparing the proposed local plan',
			'Summary of scoping consultation',
			'Summary of consultation on proposed local plan content and evidence',
			'Summary of consultation on proposed local plan',
			'Practical arrangements demonstrating readiness for examination'
		]);
		assert.strictEqual(Object.keys(GW3_REQUIRED_FILE_UPLOAD_QUESTIONS).length, 9);
	});
});
