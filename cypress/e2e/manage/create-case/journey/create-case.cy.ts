import {
	caseOfficerPage,
	caseCreatedPage,
	checkYourAnswersPage,
	keyStageDatesPage,
	planTitlePage,
	type CreateCaseData
} from '../../../../page-objects/manage/create-case/index.ts';
import { completeCreateCaseFlow } from '../../../../flows/manage/create-case-flow.ts';
import { manageHomePage } from '../../../../page-objects/manage/home-page.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');

describe('Create a case', () => {
	after(() => cy.task('clearDb'));

	it('creates a case through the full journey', { tags: ['smoke', 'regression'] }, () => {
		loadCreateCaseData().then((data) => {
			completeCreateCaseFlow(data);

			checkYourAnswersPage.verifyLoaded();
			checkYourAnswersPage.verifyAnswers(data);
			checkYourAnswersPage.verifyChangeLinksNavigateToExpectedPages(data);
			checkYourAnswersPage.openChangeLinkFor('Dates');
			keyStageDatesPage.verifyLoaded();
			keyStageDatesPage.verifyKeyStageDatesPopulated(data.dates);
			cy.go('back');
			checkYourAnswersPage.verifyLoaded();
			checkYourAnswersPage.submitCase();
			caseCreatedPage.verifyLoaded();
			caseCreatedPage.verifyReferenceFormat();
		});
	});

	it('starts a new create case journey after submitting a case', { tags: ['regression'] }, () => {
		loadCreateCaseData().then((data) => {
			completeCreateCaseFlow(data);

			checkYourAnswersPage.verifyLoaded();
			checkYourAnswersPage.submitCase();
			caseCreatedPage.verifyLoaded();

			manageHomePage.visit();
			manageHomePage.startCreateCase();
			caseOfficerPage.verifyLoaded();
			caseOfficerPage.selectCaseOfficer(data.caseOfficer.value);

			planTitlePage.verifyLoaded();
		});
	});
});
