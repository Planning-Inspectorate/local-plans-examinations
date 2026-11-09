import { portalLoginForExistingCase, TEST_EMAIL } from '../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { enterAdoptionDateInManage } from '../../flows/cross-service/examination-plan-adopted-flow.ts';
import { adoptionDate } from '../../fixtures/manage/examination.ts';
import { planDetailsPage } from '../../page-objects/portal/plan-details/plan-details-page.ts';
import { examinationPage } from '../../page-objects/portal/examination/examination-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const todayDisplay = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Cross-service Examination plan adopted', { baseUrl: Cypress.env('portalBaseUrl') }, () => {
	beforeEach(() => {
		cy.task('clearDb');
		cy.task('seedCase');
		cy.task('seedExaminationReportIssuedDocuments');
		portalLoginForExistingCase(TEST_EMAIL);
	});

	after(() => {
		cy.task('clearExaminationReportFiles', 'PLAN-001');
		cy.task('clearDb');
	});

	it(
		'Shows Plan adopted status and adoption date in Portal once the date is set in Manage',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				planDetailsPage.visit(plan.urlReference);
				planDetailsPage.verifyProgressRow('Examination', `Report issued: ${todayDisplay}`, plan.status7);

				examinationPage.visit(plan.urlReference);
				examinationPage.verifyLoaded();
				examinationPage.verifyStatusTag(plan.status7);

				enterAdoptionDateInManage(plan.reference, adoptionDate.input, adoptionDate.display);

				examinationPage.visit(plan.urlReference);
				examinationPage.verifyLoaded();
				examinationPage.verifyStatusTag(plan.status8);
				examinationPage.backLink.click();

				planDetailsPage.verifyLoaded();
				planDetailsPage.verifyProgressRow('Examination', `Adopted: ${adoptionDate.display}`, plan.status8);
			});
		}
	);
});
