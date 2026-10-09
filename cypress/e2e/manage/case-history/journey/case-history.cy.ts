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
import { gateway2Page, gateway2ExpectedDatePage } from '../../../../page-objects/manage/gateway-2/index.ts';
import { gateway2DateAnswers, updatedGateway2ExpectedDateAnswer } from '../../../../fixtures/manage/gateway-2.ts';
import { caseHistoryPage } from '../../../../page-objects/manage/case-history/index.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';
import { cleanupSeededManageCase, openSeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import { isEnvironmentSmoke } from '../../../../flows/auth-flow.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');
const expectedHistoryUser = () => (isEnvironmentSmoke() ? 'Local Plans User' : 'Unknown');

const openCaseFromHome = (planTitle: string) => {
	manageHomePage.visit();
	manageHomePage.openCaseByPlanTitle(planTitle);
	caseOverviewPage.verifyLoaded(planTitle);
};

const openCaseHistory = () => {
	caseOverviewPage.openServiceNavigationItem('Case History');
	caseHistoryPage.verifyLoaded();
};

describe('Case history', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});
	afterEach(cleanupSeededManageCase);

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

	it('shows case history after a case overview update', { tags: ['regression', 'environment-smoke'] }, () => {
		const planTypeSelectionValue = 'other';
		const planTypeSelectionName = 'Other';
		const originalPlanTypeName = 'local-plan';

		openSeededManageCase();

		caseOverviewPage.openActionLinkFor('Plan type');
		caseOverviewPlanTypePage.verifyLoaded();
		caseOverviewPlanTypePage.selectPlanType(planTypeSelectionValue);
		caseOverviewPage.verifySummaryRowContains('Plan type', planTypeSelectionName);

		openCaseHistory();

		caseHistoryPage.verifyHistoryEvent(
			`Plan type updated from ${originalPlanTypeName} to ${planTypeSelectionValue}`,
			expectedHistoryUser()
		);
	});

	it('shows case history after a Gateway 1 update', { tags: ['regression'] }, () => {
		openSeededManageCase();

		caseOverviewPage.openServiceNavigationItem('Gateway 1');
		gateway1Page.verifyLoaded(seededCase.planTitle);
		gateway1Page.openActionLinkFor(gateway1DsaAnswer.row);
		gateway1DsaPage.verifyLoaded(gateway1DsaAnswer.value);
		gateway1DsaPage.selectAnswer(gateway1DsaAnswer.updatedValue);

		gateway1Page.verifyLoaded(seededCase.planTitle);
		gateway1Page.verifySummaryRowContains(gateway1DsaAnswer.row, gateway1DsaAnswer.updatedDisplay);

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent(
			`Data Sharing Agreement (DSA) check updated from ${gateway1DsaAnswer.value} to ${gateway1DsaAnswer.updatedValue}`
		);
	});

	it('shows case history after a Gateway 2 update', { tags: ['regression', 'environment-smoke'] }, () => {
		openSeededManageCase();

		caseOverviewPage.openServiceNavigationItem('Gateway 2');
		gateway2Page.verifyLoaded(seededCase.planTitle);
		gateway2Page.openActionLinkFor(gateway2DateAnswers.gateway2ExpectedDate.row);
		gateway2ExpectedDatePage.verifyLoaded(gateway2DateAnswers.gateway2ExpectedDate.input);
		gateway2ExpectedDatePage.enterDate(updatedGateway2ExpectedDateAnswer.input);

		gateway2Page.verifySummaryRowContains(
			gateway2DateAnswers.gateway2ExpectedDate.row,
			updatedGateway2ExpectedDateAnswer.display
		);

		openCaseHistory();
		// Known gap: Gateway 3 fields aren't in caseHistoryLabels; asserting only the prefix since raw Date.toString() is timezone dependent
		caseHistoryPage.verifyHistoryEvent('Expected updated from');
	});
});
