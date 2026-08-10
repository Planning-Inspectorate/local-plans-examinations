import { openSeededExaminationPage } from '../../../../flows/manage/examination-flow.ts';
import { letterIssueDate, letterSentToMHCLGDate } from '../../../../fixtures/manage/examination.ts';
import {
	examinationPage,
	letterIssueDatePage,
	letterSentToMHCLGDatePage
} from '../../../../page-objects/manage/examination/index.ts';

describe('Examination page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it('displays the Examination Letters content for a case', { tags: ['smoke', 'regression'] }, () => {
		openSeededExaminationPage();

		examinationPage.verifyBackLink('/');
		examinationPage.verifySectionHeading('Letters');
		examinationPage.verifyExpectedLetterRows();
		examinationPage.verifyExpectedLetterAnswers();
		examinationPage.verifyExpectedLetterActionLinkHrefs();
	});

	it('loads the Letter sent to MHCLG date page', { tags: ['regression'] }, () => {
		openSeededExaminationPage();

		examinationPage.openActionLinkFor(letterSentToMHCLGDate.row);

		letterSentToMHCLGDatePage.verifyLoaded(letterSentToMHCLGDate.input);
	});

	it('loads the Letter issue date page', { tags: ['regression'] }, () => {
		openSeededExaminationPage();

		examinationPage.openActionLinkFor(letterIssueDate.row);

		letterIssueDatePage.verifyLoaded(letterIssueDate.input);
	});
});
