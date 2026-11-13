import { portalLogin } from '../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { openSeededExaminationSubmission } from '../../flows/portal/examination-submission-flow.ts';
import { examinationPage } from '../../page-objects/portal/examination/examination-application-page.ts';
import { planDetailsPage } from '../../page-objects/portal/plan-details/plan-details-page.ts';
import { assignExaminationInspectorInManage } from '../../flows/cross-service/examination-inspector-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

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
				planDetailsPage.verifyProgressRow(
					'Examination',
					`Submission expected: ${plan.dates.examination}`,
					plan.submitted
				);

				examinationPage.visit(plan.urlReference);
				examinationPage.verifyLoaded();
				examinationPage.verifyStatusTag(plan.submitted);

				assignExaminationInspectorInManage(plan.reference, 'Inspector 1');

				examinationPage.visit(plan.urlReference);
				examinationPage.verifyLoaded();
				examinationPage.verifyStatusTag(plan.inExamination);
				examinationPage.backLink.click();

				planDetailsPage.verifyLoaded();
				planDetailsPage.verifyProgressRow(
					'Examination',
					`Submission expected: ${plan.dates.examination}`,
					plan.inExamination
				);
			});
		}
	);
});
