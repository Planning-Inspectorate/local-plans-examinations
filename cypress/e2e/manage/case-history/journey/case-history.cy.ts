import { completeCreateCaseFlow } from '../../../../flows/manage/create-case-flow.ts';
import { caseOverviewPage } from '../../../../page-objects/manage/case-overview/index.ts';
import {
	caseCreatedPage,
	checkYourAnswersPage,
	type CreateCaseData
} from '../../../../page-objects/manage/create-case/index.ts';
import { caseHistoryPage } from '../../../../page-objects/manage/case-history/index.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');

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
});
