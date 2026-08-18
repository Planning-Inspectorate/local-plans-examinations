import { seededCase } from '../../fixtures/manage/case.ts';
import { caseOverviewPage } from '../../page-objects/manage/case-overview/index.ts';
import { examinationPage } from '../../page-objects/manage/examination/index.ts';
import { manageHomePage } from '../../page-objects/manage/home-page.ts';

export const openSeededExaminationPage = () => {
	cy.task('seedDb');

	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle(seededCase.planTitle);
	caseOverviewPage.verifyLoaded(seededCase.planTitle);
	caseOverviewPage.openServiceNavigationItem('Examination');
	examinationPage.verifyLoaded(seededCase.planTitle);
};
