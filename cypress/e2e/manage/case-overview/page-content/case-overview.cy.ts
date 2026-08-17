import { seededCase } from '../../../../fixtures/manage/case.ts';
import { caseOverviewPage } from '../../../../page-objects/manage/case-overview/index.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';
import { gateway3ProgrammeOfficerAnswer } from '../../../../fixtures/manage/gateway-3.ts';

describe('Case overview', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it('home page should display message when no cases exist', { tags: ['smoke'] }, () => {
		manageHomePage.visit();
		manageHomePage.verifyHeading('All cases');
		manageHomePage.verifyCreateCaseLink('Create a case');
		manageHomePage.verifyNoCasesMessage('No cases have been created yet.');
	});

	it('should display a list of cases', { tags: ['smoke'] }, () => {
		cy.task('seedDb');

		manageHomePage.visit();
		manageHomePage.verifyHeading('All cases (1)');
	});

	it('can view detailed overview of a case', { tags: ['smoke'] }, () => {
		cy.task('seedDb');

		manageHomePage.visit();
		manageHomePage.openCaseByPlanTitle(seededCase.planTitle);

		caseOverviewPage.verifyLoaded(seededCase.planTitle);
		caseOverviewPage.verifyBackLink('/');
		caseOverviewPage.verifyExpectedServiceNavigation();
		caseOverviewPage.verifyExpectedSectionHeadings();
		caseOverviewPage.verifyExpectedSummaryRows();
		caseOverviewPage.verifySummaryRowContains('Plan title', seededCase.planTitle);
		caseOverviewPage.verifySummaryRowContains('Plan type', 'Local Plan');
		caseOverviewPage.verifySummaryRowContains(
			'Local Planning Authority',
			'Local Planning Authority 1',
			'Local Planning Authority 2'
		);
		caseOverviewPage.verifySummaryRowContains('Case officer', 'Case Officer 1');
		caseOverviewPage.verifySummaryRowContains('Plan band', 'Not started');
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
		caseOverviewPage.verifySummaryRowContains(
			'Programme Officer details',
			gateway3ProgrammeOfficerAnswer.firstName,
			gateway3ProgrammeOfficerAnswer.lastName,
			gateway3ProgrammeOfficerAnswer.email
		);
		caseOverviewPage.verifyExpectedActionLinkHrefs();
		caseOverviewPage.verifyDeleteCaseButton();
	});
});
