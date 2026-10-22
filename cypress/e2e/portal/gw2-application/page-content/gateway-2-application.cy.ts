import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 2 application page content', () => {
	beforeEach(() => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			gateway2ApplicationPage.visit(plan.urlReference);
			gateway2ApplicationPage.verifyLoaded();
		});
	});

	it('Shows plan title, page header, inset text and copy text', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway2ApplicationPage.verifyServiceNavigation('Guidance', 'Sign out');
			gateway2ApplicationPage.verifyBackLink(`/manage-local-plans/${plan.urlReference}`);
			gateway2ApplicationPage.verifyCaption(plan.title);
			gateway2ApplicationPage.verifyHeading('Gateway 2 submission');
			gateway2ApplicationPage.verifyMainContains(
				`Your target submission date is ${plan.dates.gateway2}. A Gateway 2 assessment usually takes about 6 weeks.`,
				'Save and come back later',
				'Add the documents that are relevant to your plan.'
			);
			gateway2ApplicationPage.verifySaveAndComeBackLink(`/manage-local-plans/${plan.urlReference}`);
		});
	});

	it('Shows Procedural Documents', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifyProceduralDocuments();
	});

	it('Shows Consultation Documents', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifyConsultationDocuments();
	});

	it('Shows Additional Documents', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifyAdditionalDocuments();
	});

	it('Shows Submit for Gateway 2 assessment', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.verifySubmitGateway2AssessmentButton();
	});
});
