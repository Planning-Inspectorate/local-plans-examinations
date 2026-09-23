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
