import { gateway3UploadAnswers } from '../../../fixtures/portal/gateway-3-uploads.ts';
import { DocumentUploadPage } from '../base/document-upload-page.ts';

const gateway3UploadPath = (section: string, path: string) =>
	new RegExp(`^/manage-local-plans/[^/]+/gateway-3-submission/${section}/${path}$`);

export const mapOfProposedLocalPlanPoliciesPage = new DocumentUploadPage(
	gateway3UploadPath(
		gateway3UploadAnswers.mapOfProposedLocalPlanPolicies.section,
		gateway3UploadAnswers.mapOfProposedLocalPlanPolicies.path
	),
	gateway3UploadAnswers.mapOfProposedLocalPlanPolicies.fieldName,
	gateway3UploadAnswers.mapOfProposedLocalPlanPolicies.heading,
	gateway3UploadAnswers.mapOfProposedLocalPlanPolicies.caption,
	gateway3UploadAnswers.mapOfProposedLocalPlanPolicies.addCy,
	gateway3UploadAnswers.mapOfProposedLocalPlanPolicies.section,
	gateway3UploadAnswers.mapOfProposedLocalPlanPolicies.path
);

export const statementOfCompliancePage = new DocumentUploadPage(
	gateway3UploadPath(
		gateway3UploadAnswers.statementOfCompliance.section,
		gateway3UploadAnswers.statementOfCompliance.path
	),
	gateway3UploadAnswers.statementOfCompliance.fieldName,
	gateway3UploadAnswers.statementOfCompliance.heading,
	gateway3UploadAnswers.statementOfCompliance.caption,
	gateway3UploadAnswers.statementOfCompliance.addCy,
	gateway3UploadAnswers.statementOfCompliance.section,
	gateway3UploadAnswers.statementOfCompliance.path
);

export const environmentalReportPage = new DocumentUploadPage(
	gateway3UploadPath(gateway3UploadAnswers.environmentalReport.section, gateway3UploadAnswers.environmentalReport.path),
	gateway3UploadAnswers.environmentalReport.fieldName,
	gateway3UploadAnswers.environmentalReport.heading,
	gateway3UploadAnswers.environmentalReport.caption,
	gateway3UploadAnswers.environmentalReport.addCy,
	gateway3UploadAnswers.environmentalReport.section,
	gateway3UploadAnswers.environmentalReport.path
);

export const proposedLocalPlanPage = new DocumentUploadPage(
	gateway3UploadPath(gateway3UploadAnswers.proposedLocalPlan.section, gateway3UploadAnswers.proposedLocalPlan.path),
	gateway3UploadAnswers.proposedLocalPlan.fieldName,
	gateway3UploadAnswers.proposedLocalPlan.heading,
	gateway3UploadAnswers.proposedLocalPlan.caption,
	gateway3UploadAnswers.proposedLocalPlan.addCy,
	gateway3UploadAnswers.proposedLocalPlan.section,
	gateway3UploadAnswers.proposedLocalPlan.path
);

export const statementOfSoundnessPage = new DocumentUploadPage(
	gateway3UploadPath(
		gateway3UploadAnswers.statementOfSoundness.section,
		gateway3UploadAnswers.statementOfSoundness.path
	),
	gateway3UploadAnswers.statementOfSoundness.fieldName,
	gateway3UploadAnswers.statementOfSoundness.heading,
	gateway3UploadAnswers.statementOfSoundness.caption,
	gateway3UploadAnswers.statementOfSoundness.addCy,
	gateway3UploadAnswers.statementOfSoundness.section,
	gateway3UploadAnswers.statementOfSoundness.path
);

export const consultationEngagementSummaryPage = new DocumentUploadPage(
	gateway3UploadPath(
		gateway3UploadAnswers.consultationEngagementSummary.section,
		gateway3UploadAnswers.consultationEngagementSummary.path
	),
	gateway3UploadAnswers.consultationEngagementSummary.fieldName,
	gateway3UploadAnswers.consultationEngagementSummary.heading,
	gateway3UploadAnswers.consultationEngagementSummary.caption,
	gateway3UploadAnswers.consultationEngagementSummary.addCy,
	gateway3UploadAnswers.consultationEngagementSummary.section,
	gateway3UploadAnswers.consultationEngagementSummary.path
);

export const scopingConsultationSummaryPage = new DocumentUploadPage(
	gateway3UploadPath(
		gateway3UploadAnswers.scopingConsultationSummary.section,
		gateway3UploadAnswers.scopingConsultationSummary.path
	),
	gateway3UploadAnswers.scopingConsultationSummary.fieldName,
	gateway3UploadAnswers.scopingConsultationSummary.heading,
	gateway3UploadAnswers.scopingConsultationSummary.caption,
	gateway3UploadAnswers.scopingConsultationSummary.addCy,
	gateway3UploadAnswers.scopingConsultationSummary.section,
	gateway3UploadAnswers.scopingConsultationSummary.path
);

export const consultationContentEvidenceSummaryPage = new DocumentUploadPage(
	gateway3UploadPath(
		gateway3UploadAnswers.consultationContentEvidenceSummary.section,
		gateway3UploadAnswers.consultationContentEvidenceSummary.path
	),
	gateway3UploadAnswers.consultationContentEvidenceSummary.fieldName,
	gateway3UploadAnswers.consultationContentEvidenceSummary.heading,
	gateway3UploadAnswers.consultationContentEvidenceSummary.caption,
	gateway3UploadAnswers.consultationContentEvidenceSummary.addCy,
	gateway3UploadAnswers.consultationContentEvidenceSummary.section,
	gateway3UploadAnswers.consultationContentEvidenceSummary.path
);

export const consultationProposedPlanSummaryPage = new DocumentUploadPage(
	gateway3UploadPath(
		gateway3UploadAnswers.consultationProposedPlanSummary.section,
		gateway3UploadAnswers.consultationProposedPlanSummary.path
	),
	gateway3UploadAnswers.consultationProposedPlanSummary.fieldName,
	gateway3UploadAnswers.consultationProposedPlanSummary.heading,
	gateway3UploadAnswers.consultationProposedPlanSummary.caption,
	gateway3UploadAnswers.consultationProposedPlanSummary.addCy,
	gateway3UploadAnswers.consultationProposedPlanSummary.section,
	gateway3UploadAnswers.consultationProposedPlanSummary.path
);

export const practicalArrangementsStatementPage = new DocumentUploadPage(
	gateway3UploadPath(
		gateway3UploadAnswers.practicalArrangementsStatement.section,
		gateway3UploadAnswers.practicalArrangementsStatement.path
	),
	gateway3UploadAnswers.practicalArrangementsStatement.fieldName,
	gateway3UploadAnswers.practicalArrangementsStatement.heading,
	gateway3UploadAnswers.practicalArrangementsStatement.caption,
	gateway3UploadAnswers.practicalArrangementsStatement.addCy,
	gateway3UploadAnswers.practicalArrangementsStatement.section,
	gateway3UploadAnswers.practicalArrangementsStatement.path
);
