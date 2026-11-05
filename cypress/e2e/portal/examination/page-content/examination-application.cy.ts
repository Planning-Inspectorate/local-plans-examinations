import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { examinationPage } from '../../../../page-objects/portal/examination/examination-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Examination page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		cy.task('seedExaminationReadyToStart');
		loadPlanDetails().then((plan) => {
			examinationPage.visit(plan.urlReference);
			examinationPage.verifyLoaded();
		});
	});

	it('Shows plan title, page header, inset text and copy text', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			examinationPage.verifyServiceNavigation('Guidance', 'Sign out');
			examinationPage.verifyBackLink(`/manage-local-plans/${plan.urlReference}`);
			examinationPage.verifyCaption(plan.title);
			examinationPage.verifyStatusTag('Ready to start');
			examinationPage.verifyMainContains(
				'This examination is the final step to get approval to adopt your local plan. Most of these documents are required, but some are only needed in certain circumstances. For more information on the examination documents, check the guidance.',
				`You've provided the expected submission date of ${plan.dates.examination}. The examination can take up to 6 months. The process can also be paused for up to 6 months if required.`
			);
			examinationPage.verifyCheckTheGuidanceLink();
			examinationPage.verifySaveAndComeBackLink(`/manage-local-plans/${plan.urlReference}`);
		});
	});

	it('Shows all required documents', { tags: ['regression'] }, () => {
		examinationPage.verifyRequiredDocuments();
	});

	it('Shows all optional documents', { tags: ['regression'] }, () => {
		examinationPage.verifyOptionalDocuments();
	});

	it('Shows ready to submit for examination section', { tags: ['regression'] }, () => {
		examinationPage.verifySubHeading('Ready to submit for examination');
		examinationPage.verifyMainContains(
			`Once submitted, examination will be locked and you cannot make further changes.`
		);
		examinationPage.verifySubmitExaminationButton();
	});
});
