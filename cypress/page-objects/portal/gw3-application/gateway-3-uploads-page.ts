import { gateway3UploadAnswers } from '../../../fixtures/portal/gateway-3-uploads.ts';
import { DocumentUploadPage } from '../base/document-upload-page.ts';

const gateway3UploadPath = (section: string, path: string) =>
	new RegExp(`^/manage-local-plans/[^/]+/gateway-3-submission/${section}/${path}$`);

export const mapOfPropsedLocalPlanPoliciesPage = new DocumentUploadPage(
	gateway3UploadPath(
		gateway3UploadAnswers.mapOfPropsedLocalPlanPolicies.section,
		gateway3UploadAnswers.mapOfPropsedLocalPlanPolicies.path
	),
	gateway3UploadAnswers.mapOfPropsedLocalPlanPolicies.fieldName,
	gateway3UploadAnswers.mapOfPropsedLocalPlanPolicies.heading,
	gateway3UploadAnswers.mapOfPropsedLocalPlanPolicies.caption,
	gateway3UploadAnswers.mapOfPropsedLocalPlanPolicies.addCy,
	gateway3UploadAnswers.mapOfPropsedLocalPlanPolicies.section,
	gateway3UploadAnswers.mapOfPropsedLocalPlanPolicies.path
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
