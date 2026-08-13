import { completeCreateCaseFlow } from '../../../../flows/manage/create-case-flow.ts';
import { caseOverviewPage, caseOverviewPlanTypePage } from '../../../../page-objects/manage/case-overview/index.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import {
	caseCreatedPage,
	checkYourAnswersPage,
	type CreateCaseData
} from '../../../../page-objects/manage/create-case/index.ts';
import { gateway1DsaPage, gateway1Page } from '../../../../page-objects/manage/gateway-1/index.ts';
import { gateway1DsaAnswer } from '../../../../fixtures/manage/gateway-1.ts';
import { gateway2Page, workshopVenuePage } from '../../../../page-objects/manage/gateway-2/index.ts';
import { workshopVenueAnswer } from '../../../../fixtures/manage/gateway-2.ts';
import { caseHistoryPage } from '../../../../page-objects/manage/case-history/index.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');

const openCaseFromHome = (planTitle: string) => {
	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle(planTitle);
	caseOverviewPage.verifyLoaded(planTitle);
};

const openSeededCase = () => {
	cy.task('seedDb');
	openCaseFromHome(seededCase.planTitle);
};

const openCaseHistory = () => {
	caseOverviewPage.openServiceNavigationItem('Case History');
	caseHistoryPage.verifyLoaded();
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

			openCaseFromHome(data.planTitle);
			openCaseHistory();
			caseHistoryPage.verifyTableHeadings();
			caseHistoryPage.verifyHistoryEvent(`Case created for plan ${data.planTitle}`);
		});
	});

	it('shows case history after a case overview update', { tags: ['regression'] }, () => {
		const planTypeSelectionValue = 'other';
		const planTypeSelectionName = 'Other';
		const originalPlanTypeName = 'local-plan';

		openSeededCase();

		caseOverviewPage.openActionLinkFor('Plan type');
		caseOverviewPlanTypePage.verifyLoaded();
		caseOverviewPlanTypePage.selectPlanType(planTypeSelectionValue);
		caseOverviewPage.verifySummaryRowContains('Plan type', planTypeSelectionName);

		openCaseHistory();

		caseHistoryPage.verifyHistoryEvent(`Plan type updated from ${originalPlanTypeName} to ${planTypeSelectionValue}`);
	});

	it('shows case history after a Gateway 1 update', { tags: ['regression'] }, () => {
		openSeededCase();

		caseOverviewPage.openServiceNavigationItem('Gateway 1');
		gateway1Page.verifyLoaded(seededCase.planTitle);
		gateway1Page.openActionLinkFor(gateway1DsaAnswer.row);
		gateway1DsaPage.verifyLoaded(gateway1DsaAnswer.value);
		gateway1DsaPage.selectAnswer(gateway1DsaAnswer.updatedValue);

		gateway1Page.verifyLoaded(seededCase.planTitle);
		gateway1Page.verifySummaryRowContains(gateway1DsaAnswer.row, gateway1DsaAnswer.updatedDisplay);

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent(
			`Digital Sharing Agreement (DSA) check updated from ${gateway1DsaAnswer.value} to ${gateway1DsaAnswer.updatedValue}`
		);
	});

	it('shows case history after a Gateway 2 update', { tags: ['regression'] }, () => {
		openSeededCase();

		caseOverviewPage.openServiceNavigationItem('Gateway 2');
		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.openActionLinkFor(workshopVenueAnswer.row);
		workshopVenuePage.verifyLoaded(workshopVenueAnswer.heading);
		workshopVenuePage.verifyWorkshopVenueForm(workshopVenueAnswer.value);
		workshopVenuePage.enterWorkshopVenue(workshopVenueAnswer.updatedValue);

		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.verifySummaryRowContains(workshopVenueAnswer.row, workshopVenueAnswer.updatedValue);

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent(
			`Workshop venue updated from ${workshopVenueAnswer.value} to ${workshopVenueAnswer.updatedValue}`
		);
	});
});
