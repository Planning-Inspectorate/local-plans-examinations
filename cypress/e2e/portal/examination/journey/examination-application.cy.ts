import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import { examinationPage } from '../../../../page-objects/portal/examination/examination-application-page.ts';
import { submitExaminationApplication } from '../../../../flows/portal/examination-submission-flow.ts';
import {
	localPlanSubmissionForExaminationPage,
	mapOfProposedLocalPlanPoliciesPage,
	gateway3CompletionStatementPage,
	consultationEngagementSummaryPage,
	consultationProposedPlanSummaryPage,
	statementOfCompliancePage,
	statementOfSoundnessPage
} from '../../../../page-objects/portal/examination/examination-uploads-page.ts';
import { openExaminationApplicationPage } from '../../../../flows/portal/plan-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Examination application page journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		cy.task('seedExaminationReadyToStart');
	});

	after(() => cy.task('clearDb'));

	it('Navigates to Plan Details page when the Back link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			examinationPage.visit(plan.urlReference);
			examinationPage.verifyLoaded();
			examinationPage.goBack();
			planDetailsPage.verifyPathForPlan(plan.urlReference);
		});
	});

	it('Navigates to the Plan Details page when the Save and come back later is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			examinationPage.visit(plan.urlReference);
			examinationPage.verifyLoaded();
			examinationPage.saveAndComeBackLink.click();
			planDetailsPage.verifyPathForPlan(plan.urlReference);
		});
	});

	it('Navigates to the declaration page once the examination is submitted', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			submitExaminationApplication(plan, [
				{ page: localPlanSubmissionForExaminationPage, fileNames: ['test-document.pdf'] },
				{ page: mapOfProposedLocalPlanPoliciesPage, fileNames: ['test-document.pdf'] },
				{ page: gateway3CompletionStatementPage, fileNames: ['test-document.pdf'] },
				{ page: consultationEngagementSummaryPage, fileNames: ['test-document.pdf'] },
				{ page: consultationProposedPlanSummaryPage, fileNames: ['test-document.pdf'] },
				{ page: statementOfCompliancePage, fileNames: ['test-document.pdf'] },
				{ page: statementOfSoundnessPage, fileNames: ['test-document.pdf'] }
			]);
		});
	});

	it('Navigates to the Gateway 3 application page from the Plan Details page', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			openExaminationApplicationPage(plan);
		});
	});

	it(
		'Navigates to Plan details page and My plans and verifies the status is In progress after a document is uploaded',
		{ tags: ['smoke'] },
		() => {
			loadPlanDetails().then((plan) => {
				examinationPage.visit(plan.urlReference);
				examinationPage.verifyLoaded();
				examinationPage.clickAddLink(localPlanSubmissionForExaminationPage.addCy);
				localPlanSubmissionForExaminationPage.uploadAndVerifyFile('test-document.pdf');
				localPlanSubmissionForExaminationPage.saveAndReturn();
				examinationPage.saveAndComeBackLink.click();
				planDetailsPage.verifyProgressRow(plan.currentStage3, `Target date: ${plan.dates.examination}`, plan.status2);
			});
		}
	);
});
