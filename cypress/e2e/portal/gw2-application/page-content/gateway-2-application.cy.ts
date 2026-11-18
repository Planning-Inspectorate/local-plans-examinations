import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 2 application page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => {
			gateway2ApplicationPage.visit(plan.urlReference);
			gateway2ApplicationPage.verifyLoaded();
		});
	});

	after(() => cy.task('clearDb'));

	it('Shows plan title, page header, inset text and copy text', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway2ApplicationPage.verifyServiceNavigation('Guidance', 'Sign out');
			gateway2ApplicationPage.verifyBackLink(`/manage-local-plans/${plan.urlReference}`);
			gateway2ApplicationPage.verifyCaption(plan.title);
			gateway2ApplicationPage.verifyHeading('Gateway 2 submission');
			gateway2ApplicationPage.verifyStatusTag(plan.readyToStart);
			gateway2ApplicationPage.verifyMainContains(
				'Gateway 2 is the next step in the development of your local plan.',
				`You've provided the expected submission date of ${plan.dates.gateway2}. The assessment usually takes between 4 and 6 weeks from submission.`,
				'For more infomation on Gateway 2 documents'
			);
			gateway2ApplicationPage.verifySaveAndComeBackLink(`/manage-local-plans/${plan.urlReference}`);
			gateway2ApplicationPage.verifyCheckTheGuidanceLink();
		});
	});

	it('Shows Procedural Documents', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifyProceduralDocuments();
	});

	it('Shows Consultation Documents', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifyConsultationDocuments();
	});

	it('Shows Plan content, evidence and background documents', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifyPlanContentEvidenceBackgroundDocuments();
	});

	it('Shows Submit for Gateway 2 assessment', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifySubmitGateway2AssessmentButton();
	});
});
