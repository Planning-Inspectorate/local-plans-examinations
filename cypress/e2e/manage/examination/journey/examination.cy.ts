import { caseHistoryPage } from '../../../../page-objects/manage/case-history/index.ts';
import { openSeededExaminationPage } from '../../../../flows/manage/examination-flow.ts';
import { letterSentToMHCLGDate } from '../../../../fixtures/manage/examination.ts';
import { examinationPage, letterSentToMHCLGDatePage } from '../../../../page-objects/manage/examination/index.ts';

describe('Examination updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededExaminationPage();
	});

	after(() => cy.task('clearDb'));

	it('updates a Letter date and records case history', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(letterSentToMHCLGDate.row);

		letterSentToMHCLGDatePage.verifyLoaded(letterSentToMHCLGDate.input);
		letterSentToMHCLGDatePage.enterDate(letterSentToMHCLGDate.updatedInput);

		examinationPage.verifyLoaded('Cypress Test Plan');
		examinationPage.verifySummaryRowContains(letterSentToMHCLGDate.row, letterSentToMHCLGDate.updatedDisplay);

		examinationPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent(`Letter sent to MHCLG date updated to ${letterSentToMHCLGDate.updatedDisplay}`);
	});

	it('returns to Examination from a Letter date page back link', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(letterSentToMHCLGDate.row);
		letterSentToMHCLGDatePage.verifyLoaded(letterSentToMHCLGDate.input);
		letterSentToMHCLGDatePage.goBack();

		examinationPage.verifyLoaded('Cypress Test Plan');
		examinationPage.verifySummaryRowContains(letterSentToMHCLGDate.row, letterSentToMHCLGDate.display);
	});
});
