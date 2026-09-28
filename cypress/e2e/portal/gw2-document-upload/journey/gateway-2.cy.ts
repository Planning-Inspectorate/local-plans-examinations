import { openGateway2DocumentUploadPage } from '../../../../flows/portal/gateway-2-upload-flow.ts';
import { isEnvironmentSmoke } from '../../../../flows/auth-flow.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { preparePlanDetails } from '../../../../flows/portal/plan-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import {
	gateway2CoverLetterPage,
	localPlanTimetablePage,
	noticeOfIntentionToCommenceLocalPlanPage,
	subsequentWorkTowardsDraftPlanPage
} from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';

describe('Gateway 2 document upload journeys', () => {
	let planDetails: PlanDetailsFixture;
	let portalSmokeCaseReference: string | undefined;

	beforeEach(() => {
		portalSmokeCaseReference = undefined;
		cy.task('clearDb');
		preparePlanDetails().then((plan) => {
			planDetails = plan;
			if (isEnvironmentSmoke()) {
				portalSmokeCaseReference = plan.reference;
			}
		});
		portalLogin();
	});

	afterEach(() => {
		if (portalSmokeCaseReference) {
			cy.task('softDeleteCaseByReference', portalSmokeCaseReference);
		}

		cy.task('clearDb');
	});

	it('Adds a covering letter using drag and drop, then replaces it with new document', { tags: ['regression'] }, () => {
		const page = gateway2CoverLetterPage;
		openGateway2DocumentUploadPage(planDetails, page);
		page.dragAndDropAndVerifyFile('test-document.pdf');
		page.verifyReplaceFile(gateway2ApplicationPage, 'test-document.pdf', 'test-document.docx', 'goBack');
	});

	it(
		'Shows both uploaded covering letter files on the Gateway 2 submission page',
		{ tags: ['regression', 'environment-smoke'] },
		() => {
			const page = gateway2CoverLetterPage;
			openGateway2DocumentUploadPage(planDetails, page);
			page.uploadAndVerifyFiles(['test-document.pdf', 'test-document.docx']);
			page.saveAndVerifyDocumentRow(
				gateway2ApplicationPage,
				() => gateway2ApplicationPage.proceduralDocumentsTable,
				'Gateway 2 covering letter',
				'test-document.pdf',
				'test-document.docx'
			);
		}
	);

	it(
		'Adds a local plan timetable using drag and drop, then replaces it with new document',
		{ tags: ['regression'] },
		() => {
			const page = localPlanTimetablePage;
			openGateway2DocumentUploadPage(planDetails, page);
			page.dragAndDropAndVerifyFile('test-document.xlsx');
			page.verifyReplaceFile(gateway2ApplicationPage, 'test-document.xlsx', 'test-document.docx');
		}
	);

	it('Shows all uploaded local plan timetable files on the Gateway 2 submission page', { tags: ['regression'] }, () => {
		const page = localPlanTimetablePage;
		openGateway2DocumentUploadPage(planDetails, page);
		page.uploadAndVerifyFiles(['test-document.pdf', 'test-document.docx', 'test-document.xlsx']);
		page.saveAndVerifyDocumentRow(
			gateway2ApplicationPage,
			() => gateway2ApplicationPage.proceduralDocumentsTable,
			'Local plan timetable',
			'test-document.pdf',
			'test-document.docx',
			'test-document.xlsx'
		);
	});

	it(
		'Adds a notice of intention to commence local plan using drag and drop, then replaces it with new document',
		{ tags: ['regression'] },
		() => {
			const page = noticeOfIntentionToCommenceLocalPlanPage;
			openGateway2DocumentUploadPage(planDetails, page);
			page.dragAndDropAndVerifyFile('test-document.pdf');
			page.verifyReplaceFile(gateway2ApplicationPage, 'test-document.pdf', 'test-document.docx');
		}
	);

	it(
		'Shows all uploaded notice of intention to commence local plan files on the Gateway 2 submission page',
		{ tags: ['regression'] },
		() => {
			const page = noticeOfIntentionToCommenceLocalPlanPage;
			openGateway2DocumentUploadPage(planDetails, page);
			page.uploadAndVerifyFiles(['test-document.pdf', 'test-document.docx', 'test-document.xlsx']);
			page.saveAndVerifyDocumentRow(
				gateway2ApplicationPage,
				() => gateway2ApplicationPage.consultationDocumentsTable,
				'Notice of intention to commence local plan preparation',
				'test-document.pdf',
				'test-document.docx',
				'test-document.xlsx'
			);
		}
	);

	it(
		'Adds subsequent work towards a draft plan using drag and drop, then replaces it with new document',
		{ tags: ['regression'] },
		() => {
			const page = subsequentWorkTowardsDraftPlanPage;
			openGateway2DocumentUploadPage(planDetails, page);
			page.dragAndDropAndVerifyFile('test-document.pdf');
			page.verifyReplaceFile(gateway2ApplicationPage, 'test-document.pdf', 'test-document.docx');
		}
	);

	it(
		'Shows all uploaded subsequent work towards a draft plan files on the Gateway 2 submission page',
		{ tags: ['regression'] },
		() => {
			const page = subsequentWorkTowardsDraftPlanPage;
			openGateway2DocumentUploadPage(planDetails, page);
			page.uploadAndVerifyFiles(['test-document.pdf', 'test-document.docx', 'test-document.xlsx']);
			page.saveAndVerifyDocumentRow(
				gateway2ApplicationPage,
				() => gateway2ApplicationPage.additionalDocumentsTable,
				'Subsequent work towards a draft Plan',
				'test-document.pdf',
				'test-document.docx',
				'test-document.xlsx'
			);
		}
	);

	it('Downloads covering letter file when document link is clicked', { tags: ['regression'] }, () => {
		const page = gateway2CoverLetterPage;
		openGateway2DocumentUploadPage(planDetails, page);
		page.uploadAndVerifyFile('test-document.pdf');
		page.saveAndVerifyDownloadLink(
			gateway2ApplicationPage,
			() => gateway2ApplicationPage.proceduralDocumentsTable,
			'Gateway 2 covering letter',
			'test-document.pdf'
		);
	});

	it(
		'Downloads notice of intention to commence local plan file when document link is clicked',
		{ tags: ['regression'] },
		() => {
			const page = noticeOfIntentionToCommenceLocalPlanPage;
			openGateway2DocumentUploadPage(planDetails, page);
			page.uploadAndVerifyFile('test-document.docx');
			page.saveAndVerifyDownloadLink(
				gateway2ApplicationPage,
				() => gateway2ApplicationPage.consultationDocumentsTable,
				'Notice of intention to commence local plan preparation',
				'test-document.docx'
			);
		}
	);
});
