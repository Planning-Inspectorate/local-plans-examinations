import { openSeededExaminationPage } from '../../../../flows/manage/examination-flow.ts';
import {
	actualSubmissionDate,
	examinationWebsite,
	examiningInspector2,
	factCheckDateReceivedFromInspector
} from '../../../../fixtures/manage/examination.ts';
import {
	actualSubmissionDatePage,
	examinationWebsitePage,
	examiningInspector2Page,
	examinationPage,
	factCheckDateReceivedFromInspectorPage
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
		examinationWebsitePage.verifyLoaded(examinationWebsite.heading);
		examinationWebsitePage.saveAndContinue();

		examinationWebsitePage.verifyLoaded(examinationWebsite.heading);
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
