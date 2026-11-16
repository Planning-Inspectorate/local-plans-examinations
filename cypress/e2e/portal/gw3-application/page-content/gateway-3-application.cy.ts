import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 application page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();
		});
	});

	after(() => cy.task('clearDb'));

	it('Shows plan title, page header, inset text and copy text', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.verifyServiceNavigation('Guidance', 'Sign out');
			gateway3ApplicationPage.verifyBackLink(`/manage-local-plans/${plan.urlReference}`);
			gateway3ApplicationPage.verifyCaption(plan.title);
			gateway3ApplicationPage.verifyHeading('Gateway 3 submission');
			gateway3ApplicationPage.verifyStatusTag(plan.readyToStart);
			gateway3ApplicationPage.verifyMainContains(
				'Gateway 3 is the next step in the development of your local plan.',
				`You've provided the expected submission date of ${plan.dates.gateway3}. The assessment usually takes between 4 and 6 weeks from submission.`,
				'Some of these documents are required but you should aim to include all listed documents in your submission if possible.'
			);
			gateway3ApplicationPage.verifySaveAndComeBackLink(`/manage-local-plans/${plan.urlReference}`);
			gateway3ApplicationPage.verifyCheckTheGuidanceLink();
		});
	});

	it('Shows Procedural documents', { tags: ['regression'] }, () => {
		gateway3ApplicationPage.verifyProceduralDocuments();
	});

	it('Shows Consultation documents', { tags: ['regression'] }, () => {
		gateway3ApplicationPage.verifyConsultationDocuments();
	});

	it('Shows Plan content, evidence and background', { tags: ['regression'] }, () => {
		gateway3ApplicationPage.verifyPlanContentEvidenceBackgroundDocuments();
	});

	it('Shows ready to submit for Gateway 3 section', { tags: ['regression'] }, () => {
		gateway3ApplicationPage.verifySubmitGateway3Button();
	});
});
