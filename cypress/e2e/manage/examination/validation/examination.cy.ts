import { openSeededExaminationPage, openSeededExaminationReport } from '../../../../flows/manage/examination-flow.ts';
import type { SeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import {
	actualSubmissionDate,
	examinationReport as report,
	examinationWebsite,
	examiningInspector2,
	factCheckDateReceivedFromInspector,
	soundUnsound
} from '../../../../fixtures/manage/examination.ts';
import {
	actualSubmissionDatePage,
	examinationWebsitePage,
	examiningInspector2Page,
	examinationPage,
	factCheckDateReceivedFromInspectorPage,
	examinationReportUploadPage as uploadPage,
	soundUnsoundPage
} from '../../../../page-objects/manage/examination/index.ts';

describe('Examination validation', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededExaminationPage();
	});

	after(() => cy.task('clearDb'));

	it('shows an error when an Examination date is blank', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(actualSubmissionDate.row);
		actualSubmissionDatePage.verifyLoaded(actualSubmissionDate.input);
		actualSubmissionDatePage.clearDate();
		actualSubmissionDatePage.saveAndContinue();

		actualSubmissionDatePage.verifyLoaded();
		//valid date error message assertions need 2 spaces due to how the message is processed
		actualSubmissionDatePage.verifyValidationError('Enter  a valid date');
	});

	it('shows an error when Examining Inspector 2 is blank', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(examiningInspector2.row);
		examiningInspector2Page.verifyLoaded();
		examiningInspector2Page.verifyLookupAnswer(examiningInspector2.display);
		examiningInspector2Page.clearLookupAnswer();
		examiningInspector2Page.saveAndContinue();

		examiningInspector2Page.verifyLoaded();
		examiningInspector2Page.verifyValidationError('Input Examining Inspector 2');
	});

	it('shows an error when the Examination website is blank', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(examinationWebsite.row);
		examinationWebsitePage.verifyLoaded();
		examinationWebsitePage.saveAndContinue();

		examinationWebsitePage.verifyLoaded();
		examinationWebsitePage.verifyValidationError('Input an examination website');
	});

	it('shows an error when a Fact Check date is blank', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(factCheckDateReceivedFromInspector.row);
		factCheckDateReceivedFromInspectorPage.verifyLoaded(factCheckDateReceivedFromInspector.input);
		factCheckDateReceivedFromInspectorPage.clearDate();
		factCheckDateReceivedFromInspectorPage.saveAndContinue();

		factCheckDateReceivedFromInspectorPage.verifyLoaded();
		//valid date error message assertions need 2 spaces due to how the message is processed
		factCheckDateReceivedFromInspectorPage.verifyValidationError('Enter  a valid date');
	});
});

describe('Examination report validation', () => {
	let seededCase: SeededManageCase | undefined;

	beforeEach(() => {
		seededCase = undefined;
		cy.task('clearDb');
		openSeededExaminationReport().then((result) => {
			seededCase = result;
		});
	});
	afterEach(() => {
		if (seededCase) cy.task('clearExaminationReportFiles', seededCase.reference);
	});
	after(() => cy.task('clearDb'));

	it('requires a plan outcome before continuing to the report', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(report.row);
		soundUnsoundPage.verifyLoaded();
		soundUnsoundPage.saveAndContinue();
		soundUnsoundPage.verifyLoaded();
		soundUnsoundPage.verifyValidationError('Select a plan outcome');
	});

	it('requires a report before continuing to confirmation', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(report.row);
		soundUnsoundPage.selectAnswer(soundUnsound.value);
		uploadPage.verifyLoaded();
		uploadPage.saveAndReturn();
		uploadPage.verifyLoaded();
		uploadPage.verifyValidationError('Please upload the examination report');
	});
});
