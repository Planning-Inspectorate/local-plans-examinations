import { openSeededExaminationPage } from '../../../../flows/manage/examination-flow.ts';
import {
	actualSubmissionDate,
	examinationWebsite,
	examiningInspector1,
	examiningInspectors,
	examinationFactCheckDates,
	examinationLetterDates,
	examinationSubmissionDates,
	factCheckDateReceivedFromInspector,
	letterSentToMHCLGDate,
	QAExpectedAnswers
} from '../../../../fixtures/manage/examination.ts';
import {
	actualSubmissionDatePage,
	examinationPage,
	examinationWebsitePage,
	examiningInspector1Page,
	factCheckDateReceivedFromInspectorPage,
	letterSentToMHCLGDatePage
} from '../../../../page-objects/manage/examination/index.ts';

describe('Examination page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it('displays the Examination content for a case', { tags: ['smoke', 'regression'] }, () => {
		openSeededExaminationPage();

		examinationPage.verifyBackLink('/');
		examinationPage.verifySectionHeading('Examination');
		examinationPage.verifyExpectedRows(examinationSubmissionDates);
		examinationPage.verifyExpectedAnswers(examinationSubmissionDates);
		examinationPage.verifyExpectedActionLinkHrefs('examination', examinationSubmissionDates);
	});

	it('loads an Examination date page with the saved answer', { tags: ['regression'] }, () => {
		openSeededExaminationPage();

		examinationPage.openActionLinkFor(actualSubmissionDate.row);

		actualSubmissionDatePage.verifyLoaded(actualSubmissionDate.input);
	});

	it('displays the Inspectors content for a case', { tags: ['smoke', 'regression'] }, () => {
		openSeededExaminationPage();

		examinationPage.verifyBackLink('/');
		examinationPage.verifySectionHeading('Inspectors');
		examinationPage.verifyExpectedRows(examiningInspectors);
		examinationPage.verifyExpectedAnswers(examiningInspectors);
		examinationPage.verifyExpectedActionLinkHrefs('inspectors', examiningInspectors);
	});

	it('loads an Examining Inspector page with the saved answer', { tags: ['regression'] }, () => {
		openSeededExaminationPage();
		examinationPage.openActionLinkFor(examiningInspector1.row);

		examiningInspector1Page.verifyLoaded();
		examiningInspector1Page.inspectorNamePopulated(examiningInspector1.display);
	});

	it('displays the Examination website content for a case', { tags: ['smoke', 'regression'] }, () => {
		openSeededExaminationPage();

		examinationPage.verifyBackLink('/');
		examinationPage.verifySectionHeading('Examination website');
		examinationPage.verifyExpectedRows([examinationWebsite]);
		examinationPage.verifyExpectedAnswers([examinationWebsite]);
		examinationPage.verifyExpectedActionLinkHrefs('examination-website', [examinationWebsite]);
	});

	it('loads the Examination website page with no answer', { tags: ['regression'] }, () => {
		openSeededExaminationPage();

		examinationPage.openActionLinkFor(examinationWebsite.row);

		examinationWebsitePage.verifyLoaded(examinationWebsite.heading);
		examinationWebsitePage.examinationWebsiteInput.should('have.value', '');
	});

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
