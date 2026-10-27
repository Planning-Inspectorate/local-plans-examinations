import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import {
	localPlanSubmissionForExaminationPage,
	gateway3CompletionStatementPage
} from '../../../../page-objects/portal/examination/examination-uploads-page.ts';
import { examinationPage } from '../../../../page-objects/portal/examination/examination-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Examination document upload page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		cy.task('seedExaminationReadyToStart');
		loadPlanDetails().then((plan) => {
			examinationPage.visit(plan.urlReference);
			examinationPage.verifyLoaded();
		});
	});

	it('Verify the page content for the local plan submission for examination page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			examinationPage.clickAddLink(localPlanSubmissionForExaminationPage.addCy);
			localPlanSubmissionForExaminationPage.verifyPageContent(
				examinationPage.pathFor(plan.urlReference),
				'Upload a file'
			);
		});
	});

	it('Verify the page content for the statement of compliance page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			examinationPage.clickAddLink(gateway3CompletionStatementPage.addCy);
			gateway3CompletionStatementPage.verifyPageContent(examinationPage.pathFor(plan.urlReference), 'Upload a file');
		});
	});
});
