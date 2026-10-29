import {
	examinationPage,
	examinationPausePages,
	examinationReportCheckPage,
	examinationReportManagePage,
	examinationReportRemovePage,
	reportIssuedDatePage,
	soundUnsoundPage
} from '../../page-objects/manage/examination/index.ts';
import { openManageCase, openSeededManageCase, type SeededManageCase } from './seeded-case-flow.ts';
import type { SeedCyOptions } from '../../../packages/database/src/seed/seed-cy.ts';
import type { ExaminationReportSeedOptions } from '../../tasks/examination.ts';
import type { DateAnswer } from '../../types/date.ts';
import { examinationPause, soundUnsound } from '../../fixtures/manage/examination.ts';

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
