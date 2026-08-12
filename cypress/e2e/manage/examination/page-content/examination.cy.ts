import { openSeededExaminationPage } from '../../../../flows/manage/examination-flow.ts';
import {
	examinationFactCheckDates,
	examinationLetterDates,
	factCheckDateReceivedFromInspector,
	letterSentToMHCLGDate,
	QAExpectedAnswers
} from '../../../../fixtures/manage/examination.ts';
import {
	examinationPage,
	factCheckDateReceivedFromInspectorPage,
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
		examinationPage.verifyExpectedRows(examinationLetterDates);
		examinationPage.verifyExpectedAnswers(examinationLetterDates);
		examinationPage.verifyExpectedActionLinkHrefs('letters', examinationLetterDates);
	});

	it('loads a Letter date page with the saved answer', { tags: ['regression'] }, () => {
		openSeededExaminationPage();

		examinationPage.openActionLinkFor(letterSentToMHCLGDate.row);

		letterSentToMHCLGDatePage.verifyLoaded(letterSentToMHCLGDate.input);
	});

	it('displays the Examination Fact Check content for a case', { tags: ['smoke', 'regression'] }, () => {
		openSeededExaminationPage();

		examinationPage.verifyBackLink('/');
		examinationPage.verifySectionHeading('Fact Check');
		examinationPage.verifyExpectedRows(examinationFactCheckDates);
		examinationPage.verifyExpectedAnswers(examinationFactCheckDates);
		examinationPage.verifyExpectedActionLinkHrefs('fact-check', examinationFactCheckDates);
	});

	it('loads a Fact Check date page with the saved answer', { tags: ['regression'] }, () => {
		openSeededExaminationPage();

		examinationPage.openActionLinkFor(factCheckDateReceivedFromInspector.row);

		factCheckDateReceivedFromInspectorPage.verifyLoaded(factCheckDateReceivedFromInspector.input);
	});

	it('displays the QA content for a case', { tags: ['smoke', 'regression'] }, () => {
		openSeededExaminationPage();

		examinationPage.verifyBackLink('/');
		examinationPage.verifySectionHeading('QA');
		examinationPage.verifyExpectedRows(QAExpectedAnswers);
		examinationPage.verifyExpectedAnswers(QAExpectedAnswers);
		examinationPage.verifyExpectedActionLinkHrefs('QA', QAExpectedAnswers);
	});
});
