import { openExaminationDocumentUploadPage } from '../../../../flows/portal/examination-submission-flow.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import {
	mapOfProposedLocalPlanPoliciesPage,
	statementOfCompliancePage
} from '../../../../page-objects/portal/examination/examination-uploads-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Examination document upload validation tests', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		cy.task('seedExaminationReadyToStart');
	});

	after(() => cy.task('clearDb'));

	it(
		'Shows error message when the map of proposed local plan policies file type is not allowed',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = mapOfProposedLocalPlanPoliciesPage;
				openExaminationDocumentUploadPage(plan, page);
				page.verifyInvalidFileTypeError();
			});
		}
	);

	it(
		'Shows error message when no file is uploaded to the map of proposed local plan policies',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = mapOfProposedLocalPlanPoliciesPage;
				openExaminationDocumentUploadPage(plan, page);
				page.verifyNoFileUploadedError();
			});
		}
	);

	it('Shows error message when the statement of compliance file type is not allowed', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = statementOfCompliancePage;
			openExaminationDocumentUploadPage(plan, page);
			page.verifyInvalidFileTypeError();
		});
	});

	it(
		'Shows error message when no file is uploaded to the statement of compliance file',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = statementOfCompliancePage;
				openExaminationDocumentUploadPage(plan, page);
				page.verifyNoFileUploadedError();
			});
		}
	);
});
