import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { examinationPage } from '../../../../page-objects/portal/examination/examination-application-page.ts';
import { examinationSubmissionWebsitePage } from '../../../../page-objects/portal/examination/examination-website-page.ts';
import { examinationSubmissionWebsite } from '../../../../fixtures/portal/examination-website.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Examination website journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		cy.task('seedExaminationReadyToStart');
	});

	after(() => cy.task('clearDb'));

	it(
		'Shows the Gateway 3 examination website and can then update and save the new value',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				examinationPage.visit(plan.urlReference);
				examinationPage.verifyLoaded();
				examinationPage.verifyDocTableRows(examinationPage.examinationDetailsTable, [
					{
						document: examinationSubmissionWebsite.row,
						status: examinationSubmissionWebsite.value,
						addCy: examinationSubmissionWebsite.addCy
					}
				]);
				examinationPage.clickAddLink(examinationSubmissionWebsite.addCy);
				examinationSubmissionWebsitePage.verifyLoaded(examinationSubmissionWebsite.value);
				examinationSubmissionWebsitePage.enterAnswer(examinationSubmissionWebsite.updatedValue);
				examinationPage.verifyLoaded();
				examinationPage.verifyDocTableRows(examinationPage.examinationDetailsTable, [
					{
						document: examinationSubmissionWebsite.row,
						status: examinationSubmissionWebsite.updatedValue,
						addCy: examinationSubmissionWebsite.addCy
					}
				]);
			});
		}
	);
});
