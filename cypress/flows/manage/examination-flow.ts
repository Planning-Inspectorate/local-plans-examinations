import {
	examinationPage,
	examinationPausePages,
	examinationReportUploadPage,
	examinationReportCheckPage,
	examinationReportManagePage,
	examinationReportRemovePage,
	reportIssuedDatePage,
	soundUnsoundPage,
	examinationMIQUploadPage
} from '../../page-objects/manage/examination/index.ts';
import { openManageCase, openSeededManageCase, type SeededManageCase } from './seeded-case-flow.ts';
import type { SeedCyOptions } from '../../../packages/database/src/seed/seed-cy.ts';
import type {
	ExaminationReportSeedOptions,
	ExaminationSubmissionDocumentsSeedOptions
} from '../../tasks/examination.ts';
import { examinationPause, examinationReport, soundUnsound } from '../../fixtures/manage/examination.ts';
import { examinationMIQCheckPage } from '../../page-objects/manage/examination/miq-document-page.ts';
import { MIQcheckPage } from '../../fixtures/manage/examination.ts';
import {
	HearingDateAndTimePage,
	HearingExpectedDaysPage,
	RemoteOrInPersonPage,
	HearingLocationKnownPage,
	HearingVenueAddressPage,
	MeetingLinkKnownPage,
	RemoteLinkPage,
	HearingCheckPage,
	type HearingVenue
} from '../../page-objects/manage/examination/hearing-page.ts';

import type { TimeAnswer } from '../../page-objects/manage/gateway-2/workshop-set-up/workshop-date-and-time-page.ts';
import type { DateAnswer } from '../../types/date.ts';

export const pauseExamination = (pause: { input: DateAnswer; details: string } = examinationPause, pauseNumber = 1) => {
	const pages = examinationPausePages(pauseNumber);
	examinationPage.startPause();
	pages.startDate.enterDate(pause.input);
	pages.details.verifyLoaded();
	pages.details.enterAnswer(pause.details);
};

export const restartExamination = () => {
	const pages = examinationPausePages();
	examinationPage.openActionLinkFor('Examination restart date');
	pages.restartDate.enterDate(examinationPause.restartInput);
	pages.restartDetails.verifyLoaded();
	pages.restartDetails.enterAnswer(examinationPause.restartDetails);
};

export const changeExaminationReportDetails = (previousOutcome: string, outcome: string, issuedDate: DateAnswer) => {
	examinationReportCheckPage.openChangeLinkFor(soundUnsound.row);
	soundUnsoundPage.verifyLoaded(previousOutcome);
	soundUnsoundPage.selectAnswer(outcome);
	examinationReportCheckPage.openChangeLinkFor('Date');
	reportIssuedDatePage.enterDate(issuedDate);
	examinationReportCheckPage.verifyLoaded();
};

export const removeExaminationReportDocument = (fileName: string) => {
	examinationReportManagePage.removeDocument(fileName);
	examinationReportRemovePage.confirm(fileName);
};

export const openSeededExaminationReport = (options: ExaminationReportSeedOptions = {}) => {
	return cy.task<SeededManageCase>('seedExaminationReport', options).then((seededCase) => {
		openExaminationPage(seededCase);
		return cy.wrap(seededCase, { log: false });
	});
};

export const openSeededExaminationDocuments = (options: ExaminationSubmissionDocumentsSeedOptions = {}) => {
	return cy.task<SeededManageCase>('seedExaminationSubmissionDocuments', options).then((seededCase) => {
		openExaminationPage(seededCase);
		return cy.wrap(seededCase, { log: false });
	});
};

export const openExaminationPage = (seededManageCase: SeededManageCase) => {
	return openManageCase(seededManageCase).then(({ planTitle }) => {
		examinationPage.openServiceNavigationItem('Examination');
		examinationPage.verifyLoaded(planTitle);
	});
};

export const openSeededExaminationPage = (options?: SeedCyOptions) => {
	return openSeededManageCase(options).then((seededCase) => {
		examinationPage.openServiceNavigationItem('Examination');
		examinationPage.verifyLoaded(seededCase.planTitle);
		return cy.wrap(seededCase, { log: false });
	});
};

export const uploadExaminationMIQDocuments = () => {
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
};

export const uploadExaminationFinalReportDocuments = () => {
	examinationPage.openActionLinkFor(examinationReport.row);
	soundUnsoundPage.selectAnswer(soundUnsound.value);
	examinationReportUploadPage.uploadAndVerifyFile(examinationReport.fileName);
	examinationReportUploadPage.uploadAndVerifyFile(examinationReport.fileName2);
	examinationReportUploadPage.saveAndReturn();
	examinationReportCheckPage.verifyDocuments(examinationReport.fileName, examinationReport.fileName2);
	examinationReportCheckPage.confirm();
};

export type HearingDetails = {
	date: DateAnswer;
	time: TimeAnswer;
	type: 'in-person' | 'hybrid' | 'remote';
	expectedDays?: string; // leave this out to answer 'No'
	venue?: HearingVenue;
	meetingLink?: string;
};

export const setUpHearing = (hearing: HearingDetails, hearingNumber = 1) => {
	examinationPage.addHearing();
	new HearingDateAndTimePage(hearingNumber).enterDateAndTime(hearing.date, hearing.time);

	const expectedDaysPage = new HearingExpectedDaysPage(hearingNumber);
	if (hearing.expectedDays) {
		expectedDaysPage.enterDays(hearing.expectedDays);
	} else {
		expectedDaysPage.selectAnswer('no');
	}

	new RemoteOrInPersonPage(hearingNumber).selectAnswer(hearing.type);

	if (hearing.type !== 'remote') {
		const locationKnownPage = new HearingLocationKnownPage(hearingNumber);
		if (hearing.venue) {
			locationKnownPage.selectAnswer('yes');
			new HearingVenueAddressPage(hearingNumber).enterAddress(hearing.venue);
		} else {
			locationKnownPage.selectAnswer('no');
		}
	}

	if (hearing.type !== 'in-person') {
		const meetingLinkKnownPage = new MeetingLinkKnownPage(hearingNumber);
		if (hearing.meetingLink) {
			meetingLinkKnownPage.selectAnswer('yes');
			new RemoteLinkPage(hearingNumber).enterAnswer(hearing.meetingLink);
		} else {
			meetingLinkKnownPage.selectAnswer('no');
		}
	}

	new HearingCheckPage(hearingNumber).confirmHearing();
	examinationPage.verifyNotificationBanner('Hearing created');
};
