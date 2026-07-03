import { caseOverviewPage } from '../../../../page-objects/manage/case-overview/index.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

describe('Case overview', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it('home page should display message when no cases exist', () => {
		manageHomePage.visit();
		manageHomePage.verifyHeading('All cases');
		manageHomePage.verifyCreateCaseLink('Create a case');
		manageHomePage.verifyNoCasesMessage('No cases have been created yet.');
	});

	it('should display a list of cases', () => {
		cy.task('seedDb');

		manageHomePage.visit();
		manageHomePage.verifyHeading('All cases (1)');
	});

	it('can view detailed overview of a case', () => {
		cy.task('seedDb');

		manageHomePage.visit();
		manageHomePage.openCaseByPlanTitle('Cypress Test Plan');

		caseOverviewPage.verifyLoaded('Cypress Test Plan');
		caseOverviewPage.verifyExpectedServiceNavigation();
		caseOverviewPage.verifyExpectedSectionHeadings();
		caseOverviewPage.verifyExpectedSummaryRows();
		caseOverviewPage.verifySummaryRowContains('Plan title', 'Cypress Test Plan');
		caseOverviewPage.verifySummaryRowContains('Plan type', 'Local Plan');
		caseOverviewPage.verifySummaryRowContains(
			'Local Planning Authorities',
			'Local Planning Authority 1',
			'Local Planning Authority 2'
		);
		caseOverviewPage.verifySummaryRowContains('Case officer', 'Case Officer 1');
		caseOverviewPage.verifySummaryRowContains(
			'Contact details',
			'Jane',
			'Smith',
			'jane@lpa.gov.uk',
			'01234567890',
			'Bob',
			'Johnson',
			'bob@lpa.gov.uk'
		);
		caseOverviewPage.verifySummaryRowContains('Programme officer', 'Not started');
		caseOverviewPage.verifyExpectedActionLinkHrefs();
	});
});
