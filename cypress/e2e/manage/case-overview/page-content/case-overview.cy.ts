import { seededCase } from '../../../../fixtures/manage/case.ts';
import { caseOverviewPage } from '../../../../page-objects/manage/case-overview/index.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

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
		caseOverviewPage.verifyExpectedSeededAnswers();
		caseOverviewPage.verifyExpectedActionLinkHrefs();
		caseOverviewPage.verifyDeleteCaseButton();
	});
});
