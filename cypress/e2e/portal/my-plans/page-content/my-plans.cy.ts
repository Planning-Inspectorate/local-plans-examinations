import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { cleanupPreparedPlanDetails } from '../../../../flows/portal/plan-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('My plans page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
	});

	afterEach(cleanupPreparedPlanDetails);
	after(() => cy.task('clearDb'));

	it('Shows the details on the my plans page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			myPlansPage.verifyServiceNavigation('Guidance', 'Sign out');
			myPlansPage.verifyLoaded();
			myPlansPage.verifyCaption(plan.leadLpa);
			myPlansPage.verifyTableHeaders(myPlansPage.myPlansTable, ['Reference', 'Title', 'Type']);
			myPlansPage.verifyPlanDetailsRow(plan.reference, plan.title, plan.type);
			myPlansPage.verifyYourPlanLink(plan.reference);
		});
	});
});

describe('My plans page content with no plans', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it('Shows no plans available when the LPA has no plans', { tags: ['regression'] }, () => {
		myPlansPage.verifyLoaded();
		cy.task('clearDb');
		cy.reload();
		myPlansPage.verifyLoaded();
		myPlansPage.verifySubHeading('No plans available');
		myPlansPage.myPlansTable.should('not.exist');
	});
});
