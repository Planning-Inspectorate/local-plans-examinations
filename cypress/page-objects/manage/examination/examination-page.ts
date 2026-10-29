import { GatewayBasePage } from '../base/gateway-page.ts';
import {
	examinationPause,
	examinationReport,
	soundUnsound,
	soundUnsoundDate
} from '../../../fixtures/manage/examination.ts';

export class ExaminationPage extends GatewayBasePage {
	constructor() {
		super(/^\/case\/.+\/examination$/);
	}

	get hearingsHeadings() {
		return cy.getByData('hearing-heading');
	}

	get addHearingLink() {
		return cy.getByData('add-hearing');
	}

	cancelHearingLink(hearingNumber: string) {
		return cy.getByData(`cancelHearing${hearingNumber}`);
	}

	get pauseLink() {
		return cy.getByData('pause-examination');
	}

	pauseSummary(number = 1) {
		return cy.getByData(`pause-details-${number}`);
	}

	startPause() {
		this.verifyLoaded();
		this.pauseLink.should('be.visible').click();
	}

	verifyPauseDetails(number = 1, date = examinationPause.display, details = examinationPause.details) {
		this.verifyLoaded();
		this.verifySubHeading(`Pause ${number} details`);
		this.pauseSummary(number).within(() => {
			this.verifySummaryRowContains('Examination pause date', date);
			this.verifySummaryRowContains('Pause details', details);
		});
	}

	verifyPaused(number = 1, date = examinationPause.display, details = examinationPause.details) {
		this.verifyPauseDetails(number, date, details);
		this.verifyHeaderStatus('Paused');
		this.verifyNotificationBanner(examinationPause.banner);
		this.pauseSummary(number).within(() => {
			this.summaryRowActionLink('Examination restart date').should('contain.text', 'Add');
		});
		this.pauseLink.should('not.exist');
	}

	verifyRestartDetails() {
		this.verifyPauseDetails();
		this.pauseSummary().within(() => {
			this.verifySummaryRowContains('Examination restart date', examinationPause.restartDisplay);
			this.verifySummaryRowContains('Pause restart details', examinationPause.restartDetails);
		});
	}

	verifyRestarted() {
		this.verifyRestartDetails();
		this.verifyHeaderStatus('Exam in progress');
		this.verifyNotificationBannerAbsent(examinationPause.banner);
		this.pauseLink.should('be.visible').and('have.text', 'Pause again');
	}

	verifyNoPause() {
		this.verifyLoaded();
		this.verifyHeaderStatus('Exam in progress');
		this.pauseSummary().should('not.exist');
		this.pauseLink.should('be.visible').and('have.text', 'Pause examination');
		this.verifyNotificationBannerAbsent(examinationPause.banner);
		this.verifyNotificationBannerAbsent('Changes saved');
	}

	addHearing() {
		this.verifyLoaded();
		this.addHearingLink.should('be.visible').and('have.text', 'Add hearing').click();
	}

	cancelHearing(hearingNumber: string) {
		this.verifyLoaded();
		this.cancelHearingLink(hearingNumber)
			.should('be.visible')
			.and('have.text', `Cancel hearing ${hearingNumber}`)
			.click();
	}

	verifyHearingCancelled(hearingNumber: string, remoteLink: string) {
		this.verifyLoaded();
		this.cancelHearingLink(hearingNumber).should('not.exist');
		this.mainContent.should('not.contain.text', remoteLink);
	}

	verifyReportIssued(outcome: string) {
		this.verifyLoaded();
		this.verifyNotificationBanner(examinationReport.issuedMessage);
		this.verifySummaryRowContains(examinationReport.row, '1 document added');
		this.verifySummaryRowContains(soundUnsound.row, outcome);
	}

	verifyReportDetails(documentCount: number, outcome: string, issuedDate: string) {
		this.verifyLoaded();
		const documentSummary = documentCount
			? `${documentCount} document${documentCount === 1 ? '' : 's'} added`
			: 'Not provided';
		this.verifySummaryRowContains(examinationReport.row, documentSummary);
		this.verifySummaryRowContains(soundUnsound.row, outcome);
		this.verifySummaryRowContains(soundUnsoundDate.row, issuedDate);
	}

	verifyNoReport() {
		this.verifyReportDetails(0, 'Not started', 'Not started');
		this.summaryRowActionLink(examinationReport.row).should('contain.text', 'Add');
		this.verifySummaryRowActionHref(examinationReport.row, /^\/case\/.+\/examination\/outcome\/plan-outcome$/);
	}

	verifySectionContent(heading: string, section: string, rows: Array<{ row: string; display: string; path: string }>) {
		this.verifyBackLink('/');
		this.verifySectionHeading(heading);
		this.verifyExpectedRows(rows);
		this.verifyExpectedAnswers(rows);
		this.verifyExpectedActionLinkHrefs(section, rows);
	}

	verifyExpectedRows(rows: Array<{ row: string }>) {
		rows.forEach(({ row }) => {
			this.summaryRow(row).should('be.visible');
		});
	}

	verifyExpectedAnswers(rows: Array<{ row: string; display: string }>) {
		rows.forEach(({ row, display }) => {
			this.verifySummaryRowContains(row, display);
		});
	}

	verifyExpectedActionLinkHrefs(section: string, rows: Array<{ row: string; path: string }>) {
		rows.forEach(({ row, path }) => {
			this.verifySummaryRowActionHref(row, new RegExp(`^/case/.+/examination/${section}/${path}$`));
		});
	}
	verifyHearingsOrder(...hearingNumbers: number[]) {
		this.hearingsHeadings.should('have.length', hearingNumbers.length);
		hearingNumbers.forEach((hearingNumbers, index) => {
			this.hearingsHeadings.eq(index).should('have.text', `Hearing ${hearingNumbers} details`);
		});
	}
}

export const examinationPage = new ExaminationPage();
