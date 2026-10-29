import { portalLogin } from '../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { openSeededExaminationSubmission } from '../../flows/portal/examination-submission-flow.ts';
import { examinationPage } from '../../page-objects/portal/examination/examination-application-page.ts';
import { planDetailsPage } from '../../page-objects/portal/plan-details/plan-details-page.ts';
import { assignExaminationInspectorInManage } from '../../flows/cross-service/examination-inspector-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const todayDisplay = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Cross-service examination status', { baseUrl: Cypress.env('portalBaseUrl') }, () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it(
		'Shows status is In examination in Portal after an inspector is assigned in Manage',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				openSeededExaminationSubmission(plan);
				planDetailsPage.verifyProgressRow('Examination', `Submitted: ${todayDisplay}`, plan.status5);

				examinationPage.visit(plan.urlReference);
				examinationPage.verifyLoaded();
				examinationPage.verifyStatusTag(plan.status5);

				assignExaminationInspectorInManage(plan.reference, 'Inspector 1');

				examinationPage.visit(plan.urlReference);
				examinationPage.verifyLoaded();
				examinationPage.verifyStatusTag(plan.status6);
				examinationPage.backLink.click();

				planDetailsPage.verifyLoaded();
				planDetailsPage.verifyProgressRow('Examination', `Submitted: ${todayDisplay}`, plan.status6);
			});
		}
	);
});
