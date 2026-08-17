import { seededCase } from '../../fixtures/manage/case.ts';
import { caseOverviewPage } from '../../page-objects/manage/case-overview/index.ts';
import { gateway3Page } from '../../page-objects/manage/gateway-3/index.ts';
import { manageHomePage } from '../../page-objects/manage/home-page.ts';

export const openSeededGateway3Page = () => {
	cy.task('seedDb');

	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle(seededCase.planTitle);
	caseOverviewPage.verifyLoaded(seededCase.planTitle);
	caseOverviewPage.openServiceNavigationItem('Gateway 3');
	gateway3Page.verifyLoaded(seededCase.planTitle);
};
