import { caseOverviewPage } from '../../page-objects/manage/case-overview/index.ts';
import { examinationPage } from '../../page-objects/manage/examination/index.ts';
import { manageHomePage } from '../../page-objects/manage/home-page.ts';

export const openSeededExaminationPage = () => {
	cy.task('seedDb');

	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle('Cypress Test Plan');
	caseOverviewPage.verifyLoaded('Cypress Test Plan');
	caseOverviewPage.openServiceNavigationItem('Examination');
	examinationPage.verifyLoaded('Cypress Test Plan');
};
