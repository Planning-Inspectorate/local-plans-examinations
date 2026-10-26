import { caseHistoryPage } from '../../../../page-objects/manage/case-history/index.ts';
import {
	openSeededExaminationPage,
	pauseExamination,
	restartExamination
} from '../../../../flows/manage/examination-flow.ts';
import { caseOverviewPage } from '../../../../page-objects/manage/case-overview/index.ts';
import type { SeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import {
	actualSubmissionDate,
	examiningInspector1,
	examinationWebsite,
	examinationPause,
	factCheckActualDate,
	factCheckDateReceivedFromInspector,
	factCheckDueDate,
	factCheckReceivedBackFromLpaDate,
	finalReportIssueDate,
	hearingDateAndTime,
	letterSentToMHCLGDate,
	QADateAnswers,
	QAInspectorsAnswers,
	soundUnsoundDate,
	seededExaminationInProgress,
	seededPausedExamination,
	seededExaminationHearing,
	soundUnsound,
	MIQcheckPage
} from '../../../../fixtures/manage/examination.ts';
import {
	actualSubmissionDatePage,
	examinationPage,
	examinationPausePages,
	examiningInspector1Page,
	examinationWebsitePage,
	factCheckActualDatePage,
	factCheckDateReceivedFromInspectorPage,
	factCheckDueDatePage,
	factCheckReceivedBackFromLpaDatePage,
	finalReportIssueDatePage,
	letterSentToMHCLGDatePage,
	examinationQAInspector1Page,
	QADatePage,
	QAPanelResponseDatePage,
	soundUnsoundDatePage,
	soundUnsoundPage,
	examinationMIQCheckPage,
	examinationMIQUploadPage
} from '../../../../page-objects/manage/examination/index.ts';
import {
	HearingDateAndTimePage,
	hearingDateAndTimePage,
	hearingCheckPage,
	HearingCheckPage,
	cancelHearingPage,
	HearingExpectedDaysPage,
	RemoteOrInPersonPage,
	MeetingLinkKnownPage,
	RemoteLinkPage
} from '../../../../page-objects/manage/examination/hearing-page.ts';

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
		updateDateAnswer(soundUnsoundDate, soundUnsoundDatePage);

		examinationPage.openActionLinkFor(soundUnsound.row);
		soundUnsoundPage.verifyLoaded(soundUnsound.value);
		soundUnsoundPage.selectAnswer(soundUnsound.updatedValue);

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(soundUnsound.row, soundUnsound.updatedDisplay);

		openCaseHistory();

		caseHistoryPage.verifyHistoryEvent(historyEventFor(soundUnsoundDate));
		caseHistoryPage.verifyHistoryEvent(
			`${soundUnsound.row} updated from ${soundUnsound.display} to ${soundUnsound.updatedDisplay}`
		);
	});

	it('returns to Examination from an Important Dates page back link', { tags: ['regression'] }, () => {
		returnFromDatePage(soundUnsoundDate, soundUnsoundDatePage);
	});

	it('uploads MIQ documents and records case history', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(MIQcheckPage.row);

		examinationMIQUploadPage.verifyLoaded();
		examinationMIQUploadPage.uploadAndVerifyFile(MIQcheckPage.file1);
		examinationMIQUploadPage.uploadAndVerifyFile(MIQcheckPage.file2);
		examinationMIQUploadPage.saveAndReturn();

		examinationMIQCheckPage.verifyLoaded();
		examinationMIQCheckPage.verifyDocuments(MIQcheckPage.file1, MIQcheckPage.file2);
		examinationMIQCheckPage.confirm();

		examinationPage.verifyNotificationBanner('2 MIQ documents uploaded');
		examinationPage.verifySummaryRowContains(MIQcheckPage.row, MIQcheckPage.file1, MIQcheckPage.file2);
		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent('MIQs notification sent on 26 October 2026');
	});
});

describe('Examination statuses', () => {
	beforeEach(() => cy.task('clearDb'));
	after(() => cy.task('clearDb'));

	it('changes to QA only after the report-sent date is saved', { tags: ['regression'] }, () => {
		openSeededExaminationPage(seededExaminationInProgress);
		examinationPage.verifyHeaderStatus('Exam in progress');
		examinationPage.openActionLinkFor(QAInspectorsAnswers.QAInspector1.row);
		examinationQAInspector1Page.verifyLoaded();
		examinationQAInspector1Page.enterLookupAnswer(QAInspectorsAnswers.QAInspector1.input);

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifySummaryRowContains(
			QAInspectorsAnswers.QAInspector1.row,
			QAInspectorsAnswers.QAInspector1.display
		);
		examinationPage.verifyHeaderStatus('Exam in progress');
		examinationPage.openActionLinkFor(QADateAnswers.QADate.row);
		QADatePage.verifyLoaded();
		QADatePage.enterDate(QADateAnswers.QADate.input);

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifyHeaderStatus('QA');
		cy.reload();
		examinationPage.verifySummaryRowContains(QADateAnswers.QADate.row, QADateAnswers.QADate.display);
		examinationPage.verifyHeaderStatus('QA');
	});

	it(
		'preserves a pause after an unrelated edit and keeps its banner scoped to the case',
		{ tags: ['regression'] },
		() => {
			openSeededExaminationPage(seededPausedExamination).then(({ reference }) => {
				examinationPage.verifyPaused();
				examinationPage.openActionLinkFor(actualSubmissionDate.row);
				actualSubmissionDatePage.enterDate(actualSubmissionDate.input);
				cy.reload();
				examinationPage.verifyPaused();

				examinationPage.openServiceNavigationItem('Overview');
				caseOverviewPage.verifyLoaded(seededCase.planTitle);
				caseOverviewPage.verifyNotificationBanner(examinationPause.banner);
				caseOverviewPage.verifyNotificationBannerLink('View details', `/case/${reference}/examination`);
			});
			cy.task<SeededManageCase>('seedDb', seededExaminationInProgress).then(({ reference }) => {
				caseOverviewPage.visit(`/case/${reference}/overview`);
				caseOverviewPage.verifyLoaded(seededCase.planTitle);
				caseOverviewPage.verifyHeaderStatus('Exam in progress');
				caseOverviewPage.verifyNotificationBannerAbsent(examinationPause.banner);
			});
		}
	);
});

describe('Examination pauses', () => {
	const pages = examinationPausePages();
	beforeEach(() => cy.task('clearDb'));
	after(() => cy.task('clearDb'));

	it('discards an abandoned pause, then saves it and records case history', { tags: ['regression'] }, () => {
		openSeededExaminationPage(seededExaminationInProgress);
		examinationPage.startPause();
		pages.startDate.enterDate(examinationPause.input);
		pages.details.verifyLoaded();
		pages.details.goBack();
		pages.startDate.verifyLoaded(examinationPause.input);
		pages.startDate.saveAndContinue();
		pages.details.cancelChanges();
		cy.reload();
		examinationPage.verifyNoPause();

		pauseExamination();
		examinationPage.verifyNotificationBanner('Changes saved');
		examinationPage.verifyPaused();
		cy.reload();
		examinationPage.verifyPaused();
		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent('Plan paused');
	});

	it('restarts a pause and adds a second one without changing the first', { tags: ['regression'] }, () => {
		openSeededExaminationPage(seededPausedExamination);
		examinationPage.openActionLinkFor('Examination restart date');
		pages.restartDate.enterDate(examinationPause.restartInput);
		pages.restartDetails.verifyLoaded();
		pages.restartDetails.goBack();
		pages.restartDate.verifyLoaded(examinationPause.restartInput);
		pages.restartDate.saveAndContinue();
		pages.restartDetails.cancelChanges();
		examinationPage.verifyPaused();

		restartExamination();
		examinationPage.verifyNotificationBanner('Changes saved');
		examinationPage.verifyRestarted();
		cy.reload();
		examinationPage.verifyRestarted();
		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent('Plan restarted');

		examinationPage.openServiceNavigationItem('Examination');
		pauseExamination(examinationPause.second, 2);
		cy.reload();
		examinationPage.verifyRestartDetails();
		examinationPage.verifyPaused(2, examinationPause.second.display, examinationPause.second.details);
	});
});

describe('Hearing updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededExaminationPage({ examination: { hearings: { create: [seededExaminationHearing] } } });
	});
	after(() => cy.task('clearDb'));

	it('changes a saved hearing directly and records the hearing type in history', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor('Start date');
		hearingDateAndTimePage.verifyAnswers(hearingDateAndTime.date, hearingDateAndTime.time);
		hearingDateAndTimePage.enterDateAndTime(hearingDateAndTime.updatedDate, hearingDateAndTime.updatedTime);
		hearingCheckPage.verifySummaryRowContains('Hearing date', hearingDateAndTime.updatedDisplay);
		hearingCheckPage.confirmHearing();

		examinationPage.verifyLoaded(seededCase.planTitle);
		examinationPage.verifyNotificationBanner('Hearing created');
		cy.reload();
		examinationPage.verifySummaryRowContains('Start date', hearingDateAndTime.updatedDisplay);
		examinationPage.verifySummaryRowContains('Time', '11:45');
		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent('remote hearing set up');
	});

	it('cancels a hearing and records the cancellation in case history', { tags: ['regression'] }, () => {
		examinationPage.cancelHearing('1');

		cancelHearingPage.verifyLoaded();
		cancelHearingPage.confirmCancelHearing();

		examinationPage.verifyHearingCancelled('1', 'hearing 1 remote meeting link');
		openCaseHistory();
		caseHistoryPage.verifyHistoryEvent('Hearing cancelled');
	});

	it('creates a second hearing and records it in case history', { tags: ['regression'] }, () => {
		const dateAndTimePage2 = new HearingDateAndTimePage(2);
		const expectedDaysPage2 = new HearingExpectedDaysPage(2);
		const remoteOrInPersonPage2 = new RemoteOrInPersonPage(2);
		const meetingLinkKnownPage2 = new MeetingLinkKnownPage(2);
		const remoteLinkPage2 = new RemoteLinkPage(2);
		const hearingCYAPage2 = new HearingCheckPage(2);

		examinationPage.addHearing();

		dateAndTimePage2.verifyLoaded();
		dateAndTimePage2.enterDateAndTime(hearingDateAndTime.updatedDate, hearingDateAndTime.updatedTime);
		expectedDaysPage2.verifyLoaded();
		expectedDaysPage2.selectAnswer('no');
		remoteOrInPersonPage2.verifyLoaded();
		remoteOrInPersonPage2.selectAnswer('remote');
		meetingLinkKnownPage2.verifyLoaded();
		meetingLinkKnownPage2.selectAnswer('yes');
		remoteLinkPage2.verifyLoaded();
		remoteLinkPage2.enterAnswer('hearing 2 remote meeting link');

		hearingCYAPage2.verifyLoaded();
		hearingCYAPage2.confirmHearing();

		examinationPage.verifyNotificationBanner('Hearing created');
		examinationPage.verifyMainContains('Hearing 2 details');
		cy.getByData('hearing-details-2').within(() => {
			examinationPage.verifySummaryRowContains('Start date', hearingDateAndTime.updatedDisplay);
			examinationPage.verifySummaryRowContains('Time', '11:45');
			examinationPage.verifySummaryRowContains('Remote meeting link', 'hearing 2 remote meeting link');
		});
		examinationPage.verifyHearingsOrder(1, 2);
	});
});
