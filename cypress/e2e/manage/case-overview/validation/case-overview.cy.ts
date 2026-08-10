import { caseOverviewPage, caseOverviewQAInspector3Page } from '../../../../page-objects/manage/case-overview/index.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

const openSeededCase = () => {
	cy.task('seedDb');

	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle('Cypress Test Plan');
	caseOverviewPage.verifyLoaded('Cypress Test Plan');
};

describe('Case overview validation', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededCase();
	});

	after(() => cy.task('clearDb'));

	it('shows an error for QA Inspector 3 Page', { tags: ['regression'] }, () => {
		caseOverviewPage.openActionLinkFor('QA Inspector 3');

		caseOverviewQAInspector3Page.verifyLoaded();
		caseOverviewQAInspector3Page.qaInspectorNameInputID.clearAndWrite('');
		caseOverviewQAInspector3Page.submitAndVerifyValidationErrors('Input QA Inspector 3');
	});
});
