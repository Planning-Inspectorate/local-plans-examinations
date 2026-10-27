import { examinationUploadAnswers } from '../../../fixtures/portal/examination-uploads.ts';
import { DocumentUploadPage } from '../base/document-upload-page.ts';

const EXAMINATION_UPLOAD_SECTION = 'examination-details';

type ExaminationUploadAnswer = (typeof examinationUploadAnswers)[keyof typeof examinationUploadAnswers];

const examinationUploadPath = (path: string) =>
	new RegExp(`^/manage-local-plans/[^/]+/examination/${EXAMINATION_UPLOAD_SECTION}/${path}$`);

const examinationUploadPage = (answer: ExaminationUploadAnswer) =>
	new DocumentUploadPage(
		examinationUploadPath(answer.path),
		answer.fieldName,
		answer.heading,
		'',
		answer.addCy,
		EXAMINATION_UPLOAD_SECTION,
		answer.path
	);
export const localPlanSubmissionForExaminationPage = examinationUploadPage(
	examinationUploadAnswers.localPlanSubmissionForExamination
);

export const mapOfProposedLocalPlanPoliciesPage = examinationUploadPage(
	examinationUploadAnswers.mapOfProposedLocalPlanPolicies
);

export const gateway3CompletionStatementPage = examinationUploadPage(
	examinationUploadAnswers.gateway3CompletionStatement
);

export const consultationEngagementSummaryPage = examinationUploadPage(
	examinationUploadAnswers.consultationEngagementSummary
);

export const consultationProposedPlanSummaryPage = examinationUploadPage(
	examinationUploadAnswers.consultationProposedPlanSummary
);

export const statementOfCompliancePage = examinationUploadPage(examinationUploadAnswers.statementOfCompliance);

export const statementOfSoundnessPage = examinationUploadPage(examinationUploadAnswers.statementOfSoundness);
