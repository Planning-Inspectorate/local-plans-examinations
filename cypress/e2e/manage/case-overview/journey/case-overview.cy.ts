import {
	caseOverviewContactDetailsListPage,
	caseOverviewPage,
	caseOverviewPlanTitlePage,
	caseOverviewPlanTypePage,
	caseOverviewProgrammeOfficerPage
} from '../../../../page-objects/manage/case-overview/index.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

const openSeededCase = () => {
	cy.task('seedDb');

	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle('Cypress Test Plan');
	caseOverviewPage.verifyLoaded('Cypress Test Plan');
};

describe('Case overview updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededCase();
	});

	after(() => cy.task('clearDb'));

	it('updates the plan title from the overview change link', () => {
		const updatedPlanTitle = 'Updated Cypress Test Plan';

		caseOverviewPage.openActionLinkFor('Plan title');
		caseOverviewPlanTitlePage.verifyLoaded('Cypress Test Plan');
		caseOverviewPlanTitlePage.enterPlanTitle(updatedPlanTitle);

		caseOverviewPage.verifyLoaded(updatedPlanTitle);
		caseOverviewPage.verifySummaryRowContains('Plan title', updatedPlanTitle);
	});

	it('updates the plan type from the overview change link', () => {
		caseOverviewPage.openActionLinkFor('Plan type');
		caseOverviewPlanTypePage.verifyLoaded();
		caseOverviewPlanTypePage.selectPlanType('other');

		caseOverviewPage.verifyLoaded('Cypress Test Plan');
		caseOverviewPage.verifySummaryRowContains('Plan type', 'Other');
	});

	it('updates contact details from the overview change link', () => {
		const updatedContact = {
			firstName: 'Updated',
			lastName: 'Contact',
			email: 'updated.contact@example.com',
			phone: '02079460001'
		};

		caseOverviewPage.openActionLinkFor('Contact details');
		caseOverviewContactDetailsListPage.verifyLoaded();
		caseOverviewContactDetailsListPage.changeContact(updatedContact);

		caseOverviewPage.verifyLoaded('Cypress Test Plan');
		caseOverviewPage.verifySummaryRowContains(
			'Contact details',
			updatedContact.firstName,
			updatedContact.lastName,
			updatedContact.email,
			updatedContact.phone
		);
	});

	it('answers an empty overview question and updates the overview row', () => {
		const programmeOfficer = 'Programme Officer 1';

		caseOverviewPage.verifySummaryRowContains('Programme Officer', 'Not started');
		caseOverviewPage.openActionLinkFor('Programme Officer');
		caseOverviewProgrammeOfficerPage.verifyLoaded();
		caseOverviewProgrammeOfficerPage.enterProgrammeOfficer(programmeOfficer);

		caseOverviewPage.verifyLoaded('Cypress Test Plan');
		caseOverviewPage.verifySummaryRowContains('Programme Officer', programmeOfficer);
	});
});
