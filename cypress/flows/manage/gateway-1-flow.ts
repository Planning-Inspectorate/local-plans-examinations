import { caseOverviewPage } from '../../page-objects/manage/case-overview/index.ts';
import { gateway1Page } from '../../page-objects/manage/gateway-1/index.ts';
import { manageHomePage } from '../../page-objects/manage/home-page.ts';

export const openSeededGateway1Page = () => {
	cy.task('seedDb');

	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle('Cypress Test Plan');
	caseOverviewPage.verifyLoaded('Cypress Test Plan');
	caseOverviewPage.openServiceNavigationItem('Gateway 1');
	gateway1Page.verifyLoaded('Cypress Test Plan');
};
