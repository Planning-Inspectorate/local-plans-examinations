import {
	caseCreatedPage,
	checkYourAnswersPage,
	keyStageDatesPage,
	type CreateCaseData
} from '../../../../pageObjects/manage/create-case/index.ts';
import { completeCreateCaseFlow } from '../../../../flows/manage/create-case-flow.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');

describe('Create a case', () => {
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
});
