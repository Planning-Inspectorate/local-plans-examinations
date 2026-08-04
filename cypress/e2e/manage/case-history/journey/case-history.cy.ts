import { completeCreateCaseFlow } from '../../../../flows/manage/create-case-flow.ts';
import { caseOverviewPage, caseOverviewPlanTypePage } from '../../../../page-objects/manage/case-overview/index.ts';
import {
	caseCreatedPage,
	checkYourAnswersPage,
	type CreateCaseData
} from '../../../../page-objects/manage/create-case/index.ts';
import { gateway1DsaPage, gateway1Page } from '../../../../page-objects/manage/gateway-1/index.ts';
import { gateway1DsaAnswer } from '../../../../fixtures/manage/gateway-1.ts';
import { gateway2Page, workshopVenuePage } from '../../../../page-objects/manage/gateway-2/index.ts';
import { workshopVenueAnswer, updatedWorkshopVenueAnswer } from '../../../../fixtures/manage/gateway-2.ts';
import { caseHistoryPage } from '../../../../page-objects/manage/case-history/index.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');

const openSeededCase = () => {
	cy.task('seedDb');

	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle('Cypress Test Plan');
	caseOverviewPage.verifyLoaded('Cypress Test Plan');
};

describe('Case history', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it('shows the case creation history after a case is created', { tags: ['regression'] }, () => {
		loadCreateCaseData().then((data) => {
			completeCreateCaseFlow(data);
			checkYourAnswersPage.verifyLoaded();
			checkYourAnswersPage.submitCase();
			caseCreatedPage.verifyLoaded();

			manageHomePage.visit();
			manageHomePage.openCaseByPlanTitle(data.planTitle);
			caseOverviewPage.verifyLoaded(data.planTitle);
			caseOverviewPage.openServiceNavigationItem('Case History');

			caseHistoryPage.verifyLoaded();
			caseHistoryPage.verifyTableHeadings();
			caseHistoryPage.verifyCaseCreatedHistory(data.planTitle);
		});
	});

	it('shows the case overview update history', { tags: ['regression'] }, () => {
		const planTypeSelectionValue = 'other';
		const planTypeSelectionName = 'Other';
		const originalPlanTypeName = 'local-plan';
		openSeededCase();

		//overview page
		caseOverviewPage.openActionLinkFor('Plan type');
		caseOverviewPlanTypePage.verifyLoaded();
		caseOverviewPlanTypePage.selectPlanType(planTypeSelectionValue);
		caseOverviewPage.verifySummaryRowContains('Plan type', planTypeSelectionName);

		//gateway 1
		caseOverviewPage.openServiceNavigationItem('Gateway 1');
		gateway1Page.openActionLinkFor(gateway1DsaAnswer.row);
		gateway1DsaPage.verifyLoaded(gateway1DsaAnswer.value);
		gateway1DsaPage.selectAnswer(gateway1DsaAnswer.updatedValue);

		gateway1Page.verifyLoaded('Cypress Test Plan');
		gateway1Page.verifySummaryRowContains(gateway1DsaAnswer.row, gateway1DsaAnswer.updatedDisplay);

		//gateway 2
		caseOverviewPage.openServiceNavigationItem('Gateway 2');
		gateway2Page.openActionLinkFor(workshopVenueAnswer.row);

		workshopVenuePage.verifyLoaded(workshopVenueAnswer.value);
		workshopVenuePage.enterWorkshopVenue(updatedWorkshopVenueAnswer.value);

		gateway2Page.verifyLoaded('Cypress Test Plan');
		gateway2Page.verifySummaryRowContains(workshopVenueAnswer.row, updatedWorkshopVenueAnswer.value);

		caseOverviewPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyTableHeadings();

		//Due to a known bug the update history displays the raw value names
		//When fixed 'planType' and others should be changed to their appropriate names
		caseHistoryPage.verifyUpdateHistory('planType', originalPlanTypeName, planTypeSelectionValue);
		caseHistoryPage.verifyUpdateHistory('dsaChecked', gateway1DsaAnswer.value, gateway1DsaAnswer.updatedValue);
		caseHistoryPage.verifyUpdateHistory('workshopVenue', workshopVenueAnswer.value, updatedWorkshopVenueAnswer.value);
	});
});
