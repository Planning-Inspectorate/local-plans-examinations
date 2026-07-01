import { caseOverviewPage } from '../../../../page-objects/manage/case-overview-page.ts';
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
		caseOverviewPage.verifyServiceNavigation(
			'Overview',
			'Timetable',
			'Gateway 1',
			'Gateway 2',
			'Gateway 3',
			'Examination',
			'Case History'
		);
	});
});
