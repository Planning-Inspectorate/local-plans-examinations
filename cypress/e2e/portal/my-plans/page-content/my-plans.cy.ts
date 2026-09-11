import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('My plans page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it('Shows the details on the my plans page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			myPlansPage.verifyServiceNavigation('Guidance', 'Account settings', 'Manage users');
			myPlansPage.verifyLoaded();
			myPlansPage.verifyCaption(plan.leadLpa);
			myPlansPage.verifyTableHeaders(myPlansPage.myPlansTable, [
				'Reference number',
				'Lead local planning authority',
				'Plan title',
				'Current stage',
				'Status'
			]);
			myPlansPage.verifyTableRows(myPlansPage.myPlansTable, [
				{
					refNumber: plan.reference,
					localPlanningAuthority: plan.leadLpa,
					planTitle: plan.title,
					currentStage: plan.currentStage,
					status: plan.status
				}
			]);
			myPlansPage.verifyYourPlanLink(plan.reference);
		});
	});
});
