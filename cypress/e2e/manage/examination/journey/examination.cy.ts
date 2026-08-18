import { caseHistoryPage } from '../../../../page-objects/manage/case-history/index.ts';
import { openSeededExaminationPage } from '../../../../flows/manage/examination-flow.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import {
	actualSubmissionDate,
	examiningInspector1,
	examinationWebsite,
	factCheckActualDate,
	factCheckDateReceivedFromInspector,
	factCheckDueDate,
	factCheckReceivedBackFromLpaDate,
	finalReportIssueDate,
	letterSentToMHCLGDate,
	QADateAnswers,
	QAInspectorsAnswers,
	planPauseStartDate,
	soundUnsound
} from '../../../../fixtures/manage/examination.ts';
import {
	actualSubmissionDatePage,
	examinationPage,
	examiningInspector1Page,
	examinationWebsitePage,
	factCheckActualDatePage,
	factCheckDateReceivedFromInspectorPage,
	factCheckDueDatePage,
	factCheckReceivedBackFromLpaDatePage,
	finalReportIssueDatePage,
	letterSentToMHCLGDatePage,
	examinationQAInspector1Page,
	QAPanelResponseDatePage,
	planPauseStartDatePage,
	soundUnsoundPage
} from '../../../../page-objects/manage/examination/index.ts';

const factCheckUpdates = [
	{ answer: factCheckDateReceivedFromInspector, page: factCheckDateReceivedFromInspectorPage },
	{ answer: factCheckDueDate, page: factCheckDueDatePage },
	{ answer: factCheckActualDate, page: factCheckActualDatePage },
	{ answer: factCheckReceivedBackFromLpaDate, page: factCheckReceivedBackFromLpaDatePage },
	{ answer: finalReportIssueDate, page: finalReportIssueDatePage }
];

describe('Examination updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededExaminationPage();
	});

	after(() => cy.task('clearDb'));

	it('updates an Examination date and records case history', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(actualSubmissionDate.row);

		actualSubmissionDatePage.verifyLoaded(actualSubmissionDate.input);
		actualSubmissionDatePage.enterDate(actualSubmissionDate.updatedInput);

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(actualSubmissionDate.row, actualSubmissionDate.updatedDisplay);

		examinationPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent('Updated submissionForExaminationDate from'); // This will be changed to readable format once bug: LPBO-188 is resolved
	});

	it('returns to Examination from an Examination date page back link', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(actualSubmissionDate.row);
		actualSubmissionDatePage.verifyLoaded(actualSubmissionDate.input);
		actualSubmissionDatePage.goBack();

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(actualSubmissionDate.row, actualSubmissionDate.display);
	});

	it('updates an Examining Inspector and records case history', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(examiningInspector1.row);

		examiningInspector1Page.verifyLoaded();
		examiningInspector1Page.verifyLookupAnswer(examiningInspector1.display);
		examiningInspector1Page.enterLookupAnswer(examiningInspector1.updatedInput);

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(examiningInspector1.row, examiningInspector1.updatedInput);

		examinationPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent('Updated examiningInspector1 from inspector-1 to inspector-4'); // This will be changed to readable format once bug: LPBO-188 is resolved
	});

	it('returns to Examination from an Examining Inspector page back link', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(examiningInspector1.row);
		examiningInspector1Page.verifyLoaded();
		examiningInspector1Page.verifyLookupAnswer(examiningInspector1.display);
		examiningInspector1Page.goBack();

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(examiningInspector1.row, examiningInspector1.display);
	});

	it('updates the Examination website and records case history', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(examinationWebsite.row);

		examinationWebsitePage.verifyLoaded(examinationWebsite.heading);
		examinationWebsitePage.enterExaminationWebsite(examinationWebsite.updatedValue);

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(examinationWebsite.row, examinationWebsite.updatedValue);

		examinationPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent(
			`Updated examinationWebsite from null to ${examinationWebsite.updatedValue}` // This will be changed to readable format once bug: LPBO-188 is resolved
		);
	});

	it('returns to Examination from an Examination website page back link', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(examinationWebsite.row);
		examinationWebsitePage.verifyLoaded(examinationWebsite.heading);
		examinationWebsitePage.goBack();

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(examinationWebsite.row, 'Not started');
	});

	it('updates a Letter date and records case history', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(letterSentToMHCLGDate.row);

		letterSentToMHCLGDatePage.verifyLoaded(letterSentToMHCLGDate.input);
		letterSentToMHCLGDatePage.enterDate(letterSentToMHCLGDate.updatedInput);

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(letterSentToMHCLGDate.row, letterSentToMHCLGDate.updatedDisplay);

		examinationPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent(`Letter sent to MHCLG date updated to ${letterSentToMHCLGDate.updatedDisplay}`);
	});

	it('returns to Examination from a Letter date page back link', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(letterSentToMHCLGDate.row);
		letterSentToMHCLGDatePage.verifyLoaded(letterSentToMHCLGDate.input);
		letterSentToMHCLGDatePage.goBack();

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(letterSentToMHCLGDate.row, letterSentToMHCLGDate.display);
	});

	it('updates Fact Check dates and records case history', { tags: ['regression'] }, () => {
		factCheckUpdates.forEach(({ answer, page }) => {
			examinationPage.openActionLinkFor(answer.row);

			page.verifyLoaded(answer.input);
			page.enterDate(answer.updatedInput);

			examinationPage.verifyLoaded(seededCase.planTitle);
			examinationPage.verifySummaryRowContains(answer.row, answer.updatedDisplay);
		});

		examinationPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();

		factCheckUpdates.forEach(({ answer }) => {
			caseHistoryPage.verifyHistoryEvent(`${answer.row} updated to ${answer.updatedDisplay}`);
		});
	});

	it('returns to Examination from a Fact Check date page back link', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(factCheckDateReceivedFromInspector.row);
		factCheckDateReceivedFromInspectorPage.verifyLoaded(factCheckDateReceivedFromInspector.input);
		factCheckDateReceivedFromInspectorPage.goBack();

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(
			factCheckDateReceivedFromInspector.row,
			factCheckDateReceivedFromInspector.display
		);
	});

	it('updates QA Inspector 1 question and records case history', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(QAInspectorsAnswers.QAInspector1.row);

		examinationQAInspector1Page.verifyLoaded();
		examinationQAInspector1Page.enterLookupAnswer(QAInspectorsAnswers.QAInspector1.updatedInput);

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(
			QAInspectorsAnswers.QAInspector1.row,
			QAInspectorsAnswers.QAInspector1.updatedDisplay
		);

		examinationPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent('QA Inspector 1 updated to inspector-2');
	});

	it(
		'updates QA panel response sent to Inspector Date question and records case history',
		{ tags: ['regression'] },
		() => {
			examinationPage.openActionLinkFor(QADateAnswers.QAPanelResponseDate.row);

			QAPanelResponseDatePage.verifyLoaded(QADateAnswers.QAPanelResponseDate.input);
			QAPanelResponseDatePage.enterDate(QADateAnswers.QAPanelResponseDate.updatedInput);

			examinationPage.verifyLoaded(seededCase.planTitle);
			examinationPage.verifySummaryRowContains(
				QADateAnswers.QAPanelResponseDate.row,
				QADateAnswers.QAPanelResponseDate.updatedDisplay
			);

			examinationPage.openServiceNavigationItem('Case History');
			caseHistoryPage.verifyLoaded();
			caseHistoryPage.verifyHistoryEvent(
				`QA panel response sent to inspector updated to ${QADateAnswers.QAPanelResponseDate.updatedDisplay}`
			);
		}
	);

	it('updates Important Dates and records case history', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(planPauseStartDate.row);
		planPauseStartDatePage.verifyLoaded(planPauseStartDate.input);
		planPauseStartDatePage.enterDate(planPauseStartDate.updatedInput);

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(planPauseStartDate.row, planPauseStartDate.updatedDisplay);

		examinationPage.openActionLinkFor(soundUnsound.row);
		soundUnsoundPage.verifyLoaded(soundUnsound.value);
		soundUnsoundPage.selectAnswer(soundUnsound.updatedValue);

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(soundUnsound.row, soundUnsound.updatedDisplay);

		examinationPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();

		caseHistoryPage.verifyHistoryEvent(`${planPauseStartDate.row} updated to ${planPauseStartDate.updatedDisplay}`);
		caseHistoryPage.verifyHistoryEvent(`${soundUnsound.row} updated to ${soundUnsound.updatedDisplay}`);
	});

	it('returns to Examination from an Important Dates page back link', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(planPauseStartDate.row);
		planPauseStartDatePage.verifyLoaded(planPauseStartDate.input);
		planPauseStartDatePage.goBack();

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(planPauseStartDate.row, planPauseStartDate.display);
	});
});
