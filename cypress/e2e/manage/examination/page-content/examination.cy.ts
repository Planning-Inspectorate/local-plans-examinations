import { openExaminationPage, openSeededExaminationReport } from '../../../../flows/manage/examination-flow.ts';
import type { SeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import {
	actualSubmissionDate,
	examinationReport as report,
	examinationWebsite,
	examiningInspector1,
	examiningInspectors,
	examinationFactCheckDates,
	examinationImportantDates,
	examinationLetterDates,
	examinationSubmissionDates,
	factCheckDateReceivedFromInspector,
	letterSentToMHCLGDate,
	QAExpectedAnswers,
	soundUnsound
} from '../../../../fixtures/manage/examination.ts';
import {
	actualSubmissionDatePage,
	examinationPage,
	examinationReportManagePage as managePage,
	examinationWebsitePage,
	examiningInspector1Page,
	factCheckDateReceivedFromInspectorPage,
	letterSentToMHCLGDatePage
} from '../../../../page-objects/manage/examination/index.ts';

describe('Examination page content', () => {
	let seededManageCase: SeededManageCase;

	before(() => {
		cy.task('clearDb');
		cy.task<SeededManageCase>('seedDb').then((result) => {
			seededManageCase = result;
		});
	});

	beforeEach(() => {
		openExaminationPage(seededManageCase);
	});

	after(() => cy.task('clearDb'));

	it('displays the Examination content for a case', { tags: ['smoke', 'regression'] }, () => {
		examinationPage.verifySectionContent('Examination', 'examination', examinationSubmissionDates);
	});

	it('loads an Examination date page with the saved answer', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(actualSubmissionDate.row);

		actualSubmissionDatePage.verifyLoaded(actualSubmissionDate.input);
	});

	it('displays the Inspectors content for a case', { tags: ['smoke', 'regression'] }, () => {
		examinationPage.verifySectionContent('Inspectors', 'inspectors', examiningInspectors);
	});

	it('loads an Examining Inspector page with the saved answer', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(examiningInspector1.row);

		examiningInspector1Page.verifyLoaded();
		examiningInspector1Page.verifyLookupAnswer(examiningInspector1.display);
	});

	it('displays the Examination website content for a case', { tags: ['smoke', 'regression'] }, () => {
		examinationPage.verifySectionContent('Examination website', 'examination-website', [examinationWebsite]);
	});

	it('loads the Examination website page with no answer', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(examinationWebsite.row);

		examinationWebsitePage.verifyLoaded('');
	});

	it('displays the Examination Letters content for a case', { tags: ['smoke', 'regression'] }, () => {
		examinationPage.verifySectionContent('Letters', 'letters', examinationLetterDates);
	});

	it('loads a Letter date page with the saved answer', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(letterSentToMHCLGDate.row);

		letterSentToMHCLGDatePage.verifyLoaded(letterSentToMHCLGDate.input);
	});

	it('displays the Examination Fact Check content for a case', { tags: ['smoke', 'regression'] }, () => {
		examinationPage.verifySectionContent('Fact Check', 'fact-check', examinationFactCheckDates);
	});

	it('loads a Fact Check date page with the saved answer', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(factCheckDateReceivedFromInspector.row);

		factCheckDateReceivedFromInspectorPage.verifyLoaded(factCheckDateReceivedFromInspector.input);
	});

	it('displays the QA content for a case', { tags: ['smoke', 'regression'] }, () => {
		examinationPage.verifySectionContent('QA', 'QA', QAExpectedAnswers);
	});

	it('displays the Examination Important Dates content for a case', { tags: ['smoke', 'regression'] }, () => {
		examinationPage.verifySectionContent('Important dates for this plan', 'important-dates', examinationImportantDates);
	});
});

describe('Examination report content', () => {
	let seededCase: SeededManageCase;

	before(() => cy.task('clearDb'));
	after(() => {
		if (seededCase) cy.task('clearExaminationReportFiles', seededCase.reference);
		cy.task('clearDb');
	});

	it('displays the issued Outcome rows and Manage documents table', { tags: ['regression'] }, () => {
		openSeededExaminationReport({ state: 'issued', fileNames: [report.fileName, report.supportingFileName] }).then(
			(result) => {
				seededCase = result;
			}
		);
		examinationPage.verifySectionHeading('Outcome');
		examinationPage.verifyReportDetails(2, soundUnsound.display, report.issuedDisplay);
		examinationPage.verifyExpectedActionLinkHrefs('outcome', [
			{ row: report.row, path: 'examination-report-manage' },
			soundUnsound,
			{ row: 'Report issued', path: 'sound-unsound-date' }
		]);
		examinationPage.openActionLinkFor(report.row);
		managePage.verifyDocumentsContent(report.receivedDisplay, report.fileName, report.supportingFileName);
	});
});
