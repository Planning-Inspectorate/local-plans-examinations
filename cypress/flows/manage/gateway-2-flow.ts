import { caseOverviewPage } from '../../page-objects/manage/case-overview/index.ts';
import { gateway2Page } from '../../page-objects/manage/gateway-2/index.ts';
import { manageHomePage } from '../../page-objects/manage/home-page.ts';

export const openSeededGateway2Page = () => {
	cy.task('seedDb');

	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle('Cypress Test Plan');
	caseOverviewPage.verifyLoaded('Cypress Test Plan');
	caseOverviewPage.openServiceNavigationItem('Gateway 2');
	gateway2Page.verifyLoaded('Cypress Test Plan');
};
