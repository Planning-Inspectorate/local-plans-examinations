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

const updateDateAnswer = (answer: typeof actualSubmissionDate, page: typeof actualSubmissionDatePage) => {
	examinationPage.openActionLinkFor(answer.row);

	page.verifyLoaded(answer.input);
	page.enterDate(answer.updatedInput);

	examinationPage.verifyLoaded(seededCase.planTitle);
	examinationPage.verifySummaryRowContains(answer.row, answer.updatedDisplay);
};

const returnFromDatePage = (answer: typeof actualSubmissionDate, page: typeof actualSubmissionDatePage) => {
	examinationPage.openActionLinkFor(answer.row);
	page.verifyLoaded(answer.input);
	page.goBack();

	examinationPage.verifyLoaded(seededCase.planTitle);
	examinationPage.verifySummaryRowContains(answer.row, answer.display);
};

const openCaseHistory = () => {
	examinationPage.openServiceNavigationItem('Case History');
	caseHistoryPage.verifyLoaded();
};

const historyEventFor = (answer: typeof actualSubmissionDate) =>
	`${answer.row} updated from ${answer.display} to ${answer.updatedDisplay}`;

describe('Examination updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededExaminationPage();
	});

	after(() => cy.task('clearDb'));

	it('updates an Examination date and records case history', { tags: ['regression'] }, () => {
		updateDateAnswer(actualSubmissionDate, actualSubmissionDatePage);

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent(historyEventFor(actualSubmissionDate));
	});

	it('returns to Examination from an Examination date page back link', { tags: ['regression'] }, () => {
		returnFromDatePage(actualSubmissionDate, actualSubmissionDatePage);
	});

	it('updates an Examining Inspector and records case history', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(examiningInspector1.row);

		examiningInspector1Page.verifyLoaded();
		examiningInspector1Page.verifyLookupAnswer(examiningInspector1.display);
		examiningInspector1Page.enterLookupAnswer(examiningInspector1.updatedInput);

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(examiningInspector1.row, examiningInspector1.updatedInput);

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent('Examining Inspector 1 updated from inspector-1 to inspector-4');
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

		examinationWebsitePage.verifyLoaded();
		examinationWebsitePage.enterAnswer(examinationWebsite.updatedValue);

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(examinationWebsite.row, examinationWebsite.updatedValue);

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent(`Examination website updated to ${examinationWebsite.updatedValue}`);
	});

	it('returns to Examination from an Examination website page back link', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(examinationWebsite.row);
		examinationWebsitePage.verifyLoaded();
		examinationWebsitePage.goBack();

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(examinationWebsite.row, 'Not started');
	});

	it('updates a Letter date and records case history', { tags: ['regression'] }, () => {
		updateDateAnswer(letterSentToMHCLGDate, letterSentToMHCLGDatePage);

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent(historyEventFor(letterSentToMHCLGDate));
	});

	it('returns to Examination from a Letter date page back link', { tags: ['regression'] }, () => {
		returnFromDatePage(letterSentToMHCLGDate, letterSentToMHCLGDatePage);
	});

	it('updates Fact Check dates and records case history', { tags: ['regression'] }, () => {
		factCheckUpdates.forEach(({ answer, page }) => {
			updateDateAnswer(answer, page);
		});

		openCaseHistory();

		factCheckUpdates.forEach(({ answer }) => {
			caseHistoryPage.verifyHistoryEvent(historyEventFor(answer));
		});
	});

	it('returns to Examination from a Fact Check date page back link', { tags: ['regression'] }, () => {
		returnFromDatePage(factCheckDateReceivedFromInspector, factCheckDateReceivedFromInspectorPage);
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

		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent('QA Inspector 1 updated from inspector-1 to inspector-2');
	});

	it(
		'updates QA panel response sent to Inspector Date question and records case history',
		{ tags: ['regression'] },
		() => {
			updateDateAnswer(QADateAnswers.QAPanelResponseDate, QAPanelResponseDatePage);

			openCaseHistory();
			caseHistoryPage.verifyHistoryEvent(historyEventFor(QADateAnswers.QAPanelResponseDate));
		}
	);

	it('updates Important Dates and records case history', { tags: ['regression'] }, () => {
		updateDateAnswer(planPauseStartDate, planPauseStartDatePage);

		examinationPage.openActionLinkFor(soundUnsound.row);
		soundUnsoundPage.verifyLoaded(soundUnsound.value);
		soundUnsoundPage.selectAnswer(soundUnsound.updatedValue);

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(soundUnsound.row, soundUnsound.updatedDisplay);

		openCaseHistory();

		caseHistoryPage.verifyHistoryEvent(historyEventFor(planPauseStartDate));
		caseHistoryPage.verifyHistoryEvent(
			`${soundUnsound.row} updated from ${soundUnsound.display} to ${soundUnsound.updatedDisplay}`
		);
	});

	it('returns to Examination from an Important Dates page back link', { tags: ['regression'] }, () => {
		returnFromDatePage(planPauseStartDate, planPauseStartDatePage);
	});
});
