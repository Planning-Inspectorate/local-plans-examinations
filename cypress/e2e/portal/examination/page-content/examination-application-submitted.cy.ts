import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { openSeededExaminationSubmission } from '../../../../flows/portal/examination-submission-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { examinationPage } from '../../../../page-objects/portal/examination/examination-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const today = new Date();
const todayDisplay = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Examination application page content after submission', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => {
			openSeededExaminationSubmission(plan);
		});
	});

	after(() => cy.task('clearDb'));

	it('Shows the Examination submission data has been recorded correctly', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			examinationPage.visit(plan.urlReference);
			examinationPage.verifyLoaded();

			examinationPage.verifyStatusTag(plan.status5);
			examinationPage.verifySubmissionData(todayDisplay, 'test@planninginspectorate.gov.uk');

			examinationPage.verifySubHeading('Documents');
			examinationPage.verifySubmittedDocuments();
			examinationPage.verifyNoAddOrChangeLinks();
			examinationPage.verifySubmitExaminationNotShown();
		});
	});
});
