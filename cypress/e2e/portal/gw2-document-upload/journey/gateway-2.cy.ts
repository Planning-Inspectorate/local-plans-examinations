import { openGateway2DocumentUploadPage } from '../../../../flows/portal/gateway-2-upload-flow.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import {
	gateway2CoverLetterPage,
	localPlanTimetablePage,
	noticeOfIntentionToCommenceLocalPlanPage,
	subsequentWorkTowardsDraftPlanPage
} from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 2 document upload journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it('Adds a covering letter using drag and drop, then replaces it with new document', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = gateway2CoverLetterPage;
			openGateway2DocumentUploadPage(plan, page);
			gateway2CoverLetterPage.dragAndDropFile('test-document.pdf');
			gateway2CoverLetterPage.clickUploadFiles();
			gateway2CoverLetterPage.verifyFileUploaded('test-document.pdf');

			gateway2CoverLetterPage.goBack();
			gateway2ApplicationPage.verifyLoaded();

			gateway2ApplicationPage.clickAddLink(page.addCy);
			gateway2CoverLetterPage.verifyLoaded();
			gateway2CoverLetterPage.verifyFileUploaded('test-document.pdf');

			gateway2CoverLetterPage.removeFile();
			gateway2CoverLetterPage.verifyFileNotUploaded('test-document.pdf');

			gateway2CoverLetterPage.uploadFile('test-document.docx');
			gateway2CoverLetterPage.clickUploadFiles();
			gateway2CoverLetterPage.verifyFileUploaded('test-document.docx');
		});
	});

	it('Shows both uploaded covering letter files on the Gateway 2 submission page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = gateway2CoverLetterPage;
			openGateway2DocumentUploadPage(plan, page);
			gateway2CoverLetterPage.uploadFile('test-document.pdf');
			gateway2CoverLetterPage.clickUploadFiles();
			gateway2CoverLetterPage.verifyFileUploaded('test-document.pdf');

			gateway2CoverLetterPage.uploadFile('test-document.docx');
			gateway2CoverLetterPage.clickUploadFiles();
			gateway2CoverLetterPage.verifyFileUploaded('test-document.docx');

			gateway2CoverLetterPage.saveAndReturn();
			gateway2ApplicationPage.verifyLoaded();

			gateway2ApplicationPage.verifyDocumentRowContains(
				gateway2ApplicationPage.proceduralDocumentsTable,
				'Gateway 2 covering letter',
				'test-document.pdf',
				'test-document.docx'
			);
		});
	});

	it(
		'Adds a local plan timetable using drag and drop, then replaces it with new document',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = localPlanTimetablePage;
				openGateway2DocumentUploadPage(plan, page);
				localPlanTimetablePage.dragAndDropFile('test-document.xlsx');
				localPlanTimetablePage.clickUploadFiles();
				localPlanTimetablePage.verifyFileUploaded('test-document.xlsx');

				localPlanTimetablePage.saveAndReturn();
				gateway2ApplicationPage.verifyLoaded();

				gateway2ApplicationPage.clickAddLink(page.addCy);
				localPlanTimetablePage.verifyLoaded();
				localPlanTimetablePage.verifyFileUploaded('test-document.xlsx');

				localPlanTimetablePage.removeFile();
				localPlanTimetablePage.verifyFileNotUploaded('test-document.xlsx');

				localPlanTimetablePage.uploadFile('test-document.docx');
				localPlanTimetablePage.clickUploadFiles();
				localPlanTimetablePage.verifyFileUploaded('test-document.docx');
			});
		}
	);

	it('Shows all uploaded local plan timetable files on the Gateway 2 submission page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = localPlanTimetablePage;
			openGateway2DocumentUploadPage(plan, page);
			localPlanTimetablePage.uploadFile(['test-document.pdf', 'test-document.docx', 'test-document.xlsx']);
			localPlanTimetablePage.clickUploadFiles();
			localPlanTimetablePage.verifyFileUploaded('test-document.pdf', 'test-document.docx', 'test-document.xlsx');

			localPlanTimetablePage.saveAndReturn();
			gateway2ApplicationPage.verifyLoaded();

			gateway2ApplicationPage.verifyDocumentRowContains(
				gateway2ApplicationPage.proceduralDocumentsTable,
				'Local plan timetable',
				'test-document.pdf',
				'test-document.docx',
				'test-document.xlsx'
			);
		});
	});

	it(
		'Adds a notice of intention to commence local plan using drag and drop, then replaces it with new document',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = noticeOfIntentionToCommenceLocalPlanPage;
				openGateway2DocumentUploadPage(plan, page);
				noticeOfIntentionToCommenceLocalPlanPage.dragAndDropFile('test-document.pdf');
				noticeOfIntentionToCommenceLocalPlanPage.clickUploadFiles();
				noticeOfIntentionToCommenceLocalPlanPage.verifyFileUploaded('test-document.pdf');

				noticeOfIntentionToCommenceLocalPlanPage.saveAndReturn();
				gateway2ApplicationPage.verifyLoaded();

				noticeOfIntentionToCommenceLocalPlanPage.clickAddLink(page.addCy);
				noticeOfIntentionToCommenceLocalPlanPage.verifyLoaded();
				noticeOfIntentionToCommenceLocalPlanPage.verifyFileUploaded('test-document.pdf');

				noticeOfIntentionToCommenceLocalPlanPage.removeFile();
				noticeOfIntentionToCommenceLocalPlanPage.verifyFileNotUploaded('test-document.pdf');

				noticeOfIntentionToCommenceLocalPlanPage.uploadFile('test-document.docx');
				noticeOfIntentionToCommenceLocalPlanPage.clickUploadFiles();
				noticeOfIntentionToCommenceLocalPlanPage.verifyFileUploaded('test-document.docx');
			});
		}
	);

	it(
		'Shows all uploaded notice of intention to commence local plan files on the Gateway 2 submission page',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = noticeOfIntentionToCommenceLocalPlanPage;
				openGateway2DocumentUploadPage(plan, page);
				noticeOfIntentionToCommenceLocalPlanPage.uploadFile([
					'test-document.pdf',
					'test-document.docx',
					'test-document.xlsx'
				]);
				noticeOfIntentionToCommenceLocalPlanPage.clickUploadFiles();
				noticeOfIntentionToCommenceLocalPlanPage.verifyFileUploaded(
					'test-document.pdf',
					'test-document.docx',
					'test-document.xlsx'
				);

				noticeOfIntentionToCommenceLocalPlanPage.saveAndReturn();
				gateway2ApplicationPage.verifyLoaded();

				gateway2ApplicationPage.verifyDocumentRowContains(
					gateway2ApplicationPage.consultationDocumentsTable,
					'Notice of intention to commence local plan preparation',
					'test-document.pdf',
					'test-document.docx',
					'test-document.xlsx'
				);
			});
		}
	);

	it(
		'Adds subsequent work towards a draft plan using drag and drop, then replaces it with new document',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = subsequentWorkTowardsDraftPlanPage;
				openGateway2DocumentUploadPage(plan, page);
				subsequentWorkTowardsDraftPlanPage.dragAndDropFile('test-document.pdf');
				subsequentWorkTowardsDraftPlanPage.clickUploadFiles();
				subsequentWorkTowardsDraftPlanPage.verifyFileUploaded('test-document.pdf');

				subsequentWorkTowardsDraftPlanPage.saveAndReturn();
				gateway2ApplicationPage.verifyLoaded();

				subsequentWorkTowardsDraftPlanPage.clickAddLink(page.addCy);
				subsequentWorkTowardsDraftPlanPage.verifyLoaded();
				subsequentWorkTowardsDraftPlanPage.verifyFileUploaded('test-document.pdf');

				subsequentWorkTowardsDraftPlanPage.removeFile();
				subsequentWorkTowardsDraftPlanPage.verifyFileNotUploaded('test-document.pdf');

				subsequentWorkTowardsDraftPlanPage.uploadFile('test-document.docx');
				subsequentWorkTowardsDraftPlanPage.clickUploadFiles();
				subsequentWorkTowardsDraftPlanPage.verifyFileUploaded('test-document.docx');
			});
		}
	);

	it(
		'Shows all uploaded subsequent work towards a draft plan files on the Gateway 2 submission page',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = subsequentWorkTowardsDraftPlanPage;
				openGateway2DocumentUploadPage(plan, page);
				subsequentWorkTowardsDraftPlanPage.uploadFile([
					'test-document.pdf',
					'test-document.docx',
					'test-document.xlsx'
				]);
				subsequentWorkTowardsDraftPlanPage.clickUploadFiles();
				subsequentWorkTowardsDraftPlanPage.verifyFileUploaded(
					'test-document.pdf',
					'test-document.docx',
					'test-document.xlsx'
				);

				subsequentWorkTowardsDraftPlanPage.saveAndReturn();
				gateway2ApplicationPage.verifyLoaded();

				gateway2ApplicationPage.verifyDocumentRowContains(
					gateway2ApplicationPage.additionalDocumentsTable,
					'Subsequent work towards a draft Plan',
					'test-document.pdf',
					'test-document.docx',
					'test-document.xlsx'
				);
			});
		}
	);
});
