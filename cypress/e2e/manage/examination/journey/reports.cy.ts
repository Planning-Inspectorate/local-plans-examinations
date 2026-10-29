import {
	changeExaminationReportDetails,
	openSeededExaminationReport,
	removeExaminationReportDocument
} from '../../../../flows/manage/examination-flow.ts';
import type { SeededManageCase } from '../../../../flows/manage/seeded-case-flow.ts';
import type { ExaminationReportSeedOptions } from '../../../../tasks/examination.ts';
import {
	examinationReport as report,
	soundUnsound,
	soundUnsoundDate
} from '../../../../fixtures/manage/examination.ts';
import { caseHistoryPage } from '../../../../page-objects/manage/case-history/case-history-page.ts';
import {
	examinationPage,
	examinationReportCheckPage as checkPage,
	examinationReportManagePage as managePage,
	examinationReportRemovePage as removePage,
	examinationReportUploadPage as uploadPage,
	soundUnsoundPage,
	soundUnsoundDatePage
} from '../../../../page-objects/manage/examination/index.ts';

describe('Examination report journeys', () => {
	let seededCase: SeededManageCase | undefined;

	const openReport = (options: ExaminationReportSeedOptions = {}) => {
		return openSeededExaminationReport(options).then((result) => {
			seededCase = result;
			return result;
		});
	};

	beforeEach(() => {
		seededCase = undefined;
		cy.task('clearDb');
	});

	afterEach(() => {
		if (seededCase) cy.task('clearExaminationReportFiles', seededCase.reference);
	});

	after(() => cy.task('clearDb'));

	it('issues an initial report after returning to the plan outcome', { tags: ['regression'] }, () => {
		openReport();
		examinationPage.verifyNoReport();
		examinationPage.openActionLinkFor(report.row);
		soundUnsoundPage.selectAnswer(soundUnsound.value);
		uploadPage.uploadAndVerifyFile(report.fileName);
		uploadPage.goBack();
		soundUnsoundPage.verifyLoaded(soundUnsound.value);
		soundUnsoundPage.saveAndContinue();
		uploadPage.verifyFileUploaded(report.fileName);
		uploadPage.saveAndReturn();
		checkPage.verifyDocuments(report.fileName);
		checkPage.confirm();

		examinationPage.verifyReportIssued(soundUnsound.display);
		examinationPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent('Examination report issued on');
	});

	it('issues the first report after its issue date was entered manually', { tags: ['regression'] }, () => {
		openReport();
		examinationPage.openActionLinkFor(soundUnsound.row);
		soundUnsoundPage.selectAnswer(soundUnsound.value);
		examinationPage.openActionLinkFor(soundUnsoundDate.row);
		soundUnsoundDatePage.enterDate(soundUnsoundDate.input);

		examinationPage.openActionLinkFor(report.row);
		soundUnsoundPage.verifyLoaded(soundUnsound.value);
		soundUnsoundPage.saveAndContinue();
		uploadPage.uploadAndVerifyFile(report.fileName);
		uploadPage.saveAndReturn();
		checkPage.verifyAnswers(soundUnsound.display, soundUnsoundDate.display, report.fileName);
		checkPage.confirm();

		examinationPage.verifyReportIssued(soundUnsound.display);
		cy.reload();
		examinationPage.verifyReportDetails(1, soundUnsound.display, soundUnsoundDate.display);
		examinationPage.openServiceNavigationItem('Case History');
		caseHistoryPage.verifyLoaded();
		caseHistoryPage.verifyHistoryEvent(`Examination report issued on ${soundUnsoundDate.display}`);
	});

	it('keeps report answers when changing the CYA outcome, date and documents', { tags: ['regression'] }, () => {
		openReport({ state: 'awaiting-confirmation' }).then(({ reference }) => checkPage.visitForCase(reference));
		changeExaminationReportDetails(soundUnsound.value, soundUnsound.updatedValue, report.updatedDate);
		checkPage.openChangeLinkFor('Document 1');
		uploadPage.verifyFileUploaded(report.fileName);
		uploadPage.uploadAndVerifyFile(report.supportingFileName);
		uploadPage.removeFile(report.supportingFileName);
		uploadPage.verifyFileUploaded(report.fileName);
		uploadPage.verifyFileNotUploaded(report.supportingFileName);
		uploadPage.saveAndReturn();
		checkPage.verifyAnswers(soundUnsound.updatedDisplay, report.updatedDateDisplay, report.fileName);
		checkPage.confirm();

		examinationPage.verifyReportIssued(soundUnsound.updatedDisplay);
		cy.reload();
		examinationPage.verifyReportDetails(1, soundUnsound.updatedDisplay, report.updatedDateDisplay);
	});

	it(
		'adds a supporting document without replacing the report or its manual issue date',
		{ tags: ['regression'] },
		() => {
			openReport({ state: 'issued' });
			examinationPage.openActionLinkFor(report.row);
			managePage.addDocument();
			uploadPage.verifyFileUploaded(report.fileName);
			uploadPage.uploadAndVerifyFile(report.supportingFileName);
			uploadPage.saveAndReturn();
			checkPage.verifyAnswers(soundUnsound.display, report.issuedDisplay, report.fileName, report.supportingFileName);
			checkPage.confirm();

			managePage.verifyDocumentAdded(report.fileName, report.supportingFileName);
			managePage.goBack();
			examinationPage.verifyReportDetails(2, soundUnsound.display, report.issuedDisplay);
		}
	);

	it(
		'cancels removal, removes one saved file and resets the outcome only after removing the last',
		{ tags: ['regression'] },
		() => {
			openReport({ state: 'issued', fileNames: [report.fileName, report.supportingFileName] });
			examinationPage.openActionLinkFor(report.row);
			managePage.removeDocument(report.supportingFileName);
			removePage.cancel(report.supportingFileName);
			managePage.verifyDocumentsPersisted(report.fileName, report.supportingFileName);
			removeExaminationReportDocument(report.supportingFileName);
			managePage.verifyDocumentsPersisted(report.fileName);
			managePage.goBack();
			examinationPage.verifyReportDetails(1, soundUnsound.display, report.issuedDisplay);
			examinationPage.openActionLinkFor(report.row);
			removeExaminationReportDocument(report.fileName);
			managePage.verifyDocuments();
			managePage.goBack();
			cy.reload();
			examinationPage.verifyNoReport();
		}
	);
});
