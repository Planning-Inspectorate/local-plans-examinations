import {
	openExaminationPage,
	openSeededExaminationDocuments,
	openSeededExaminationReport,
	openSeededExaminationPage
} from '../../../../flows/manage/examination-flow.ts';
import type { SeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import {
	actualSubmissionDate,
	examinationDocuments,
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
	programmeOfficer,
	QAExpectedAnswers,
	soundUnsound,
	seededExaminationHearing
} from '../../../../fixtures/manage/examination.ts';
import {
	actualSubmissionDatePage,
	examinationDocumentsPage,
	examinationPage,
	examinationProgrammeOfficerPage,
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

	it('displays the Programme officer row below Submission received', { tags: ['smoke', 'regression'] }, () => {
		examinationPage.verifyRowOrder(actualSubmissionDate.row, programmeOfficer.row);
		examinationPage.verifySummaryRowContains(
			programmeOfficer.row,
			programmeOfficer.firstName,
			programmeOfficer.lastName,
			programmeOfficer.email
		);
		examinationPage.summaryRowActionLink(programmeOfficer.row).should('contain.text', 'Change');
		examinationPage.verifyExpectedActionLinkHrefs('examination', [programmeOfficer]);
	});

	it('loads the Programme officer details page with the saved answers', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(programmeOfficer.row);

		examinationProgrammeOfficerPage.verifyLoaded(
			programmeOfficer.firstName,
			programmeOfficer.lastName,
			programmeOfficer.email
		);
		examinationProgrammeOfficerPage.verifyBackLink();
	});

	it(
		'displays the Examination website row below Programme officer without its own heading',
		{ tags: ['smoke', 'regression'] },
		() => {
			examinationPage.verifyRowOrder(programmeOfficer.row, examinationWebsite.row);
			examinationPage.verifyExpectedAnswers([examinationWebsite]);
			examinationPage.verifyExpectedActionLinkHrefs('examination', [examinationWebsite]);
			examinationPage.sectionHeading(examinationWebsite.row).should('not.exist');
		}
	);

	it(
		'displays the Documents row without a Review link before documents are submitted',
		{ tags: ['regression'] },
		() => {
			examinationPage.verifyRowOrder(examinationWebsite.row, examinationDocuments.row);
			examinationPage.verifySummaryRowContains(examinationDocuments.row, '0 document(s)');
			examinationPage.summaryRowActionLink(examinationDocuments.row).should('not.exist');
		}
	);

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

describe('Examination documents content', () => {
	beforeEach(() => cy.task('clearDb'));
	after(() => cy.task('clearDb'));

	it('displays the submitted documents under Required and Other as download links', { tags: ['regression'] }, () => {
		openSeededExaminationDocuments({ examinationWebsiteUrl: examinationDocuments.websiteUrl });

		examinationPage.verifySummaryRowContains(examinationDocuments.row, '3 document(s)');
		examinationPage.summaryRowActionLink(examinationDocuments.row).should('contain.text', 'Review');
		examinationPage.openActionLinkFor(examinationDocuments.row);

		examinationDocumentsPage.verifyLoaded();
		examinationDocumentsPage.verifyExaminationWebsite(
			examinationDocuments.websiteUrl,
			examinationDocuments.websiteHref
		);
		examinationDocumentsPage.verifyDocuments('required', examinationDocuments.required);
		examinationDocumentsPage.verifyDocuments('other', examinationDocuments.other);
		examinationDocumentsPage.verifyDocumentNotProvided('required', 'Statement of soundness');
	});

	it('hides the Review link while the LPA submission is still in progress', { tags: ['regression'] }, () => {
		openSeededExaminationDocuments({ submitted: false });

		examinationPage.verifySummaryRowContains(examinationDocuments.row, '3 document(s)');
		examinationPage.summaryRowActionLink(examinationDocuments.row).should('not.exist');
	});
});

describe('Hearings content', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});
	after(() => cy.task('clearDb'));

	it('displays a hearing', { tags: ['regression'] }, () => {
		openSeededExaminationPage({ examination: { hearings: { create: [seededExaminationHearing] } } });
		examinationPage.verifyHearingsOrder(1);
	});

	it('displays multiple hearings', { tags: ['regression'] }, () => {
		openSeededExaminationPage({
			examination: { hearings: { create: [seededExaminationHearing, seededExaminationHearing] } }
		});
		examinationPage.verifyHearingsOrder(1, 2);
	});
});
