import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { examinationPage } from '../../../../page-objects/portal/examination/examination-application-page.ts';
import {
	mapOfProposedLocalPlanPoliciesPage,
	statementOfCompliancePage
} from '../../../../page-objects/portal/examination/examination-uploads-page.ts';
import { openExaminationDocumentUploadPage } from '../../../../flows/portal/examination-submission-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Examination document upload journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		cy.task('seedExaminationReadyToStart');
	});

	after(() => cy.task('clearDb'));

	it(
		'Adds a map of proposed local plan policies using drag and drop, then replaces it with new document',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = mapOfProposedLocalPlanPoliciesPage;
				openExaminationDocumentUploadPage(plan, page);
				page.dragAndDropAndVerifyFile('test-document.pdf');
				page.verifyReplaceFile(examinationPage, 'test-document.pdf', 'test-document.docx', 'goBack');
			});
		}
	);

	it(
		'Shows both uploaded map of proposed local plan policies files on the examination page',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = mapOfProposedLocalPlanPoliciesPage;
				openExaminationDocumentUploadPage(plan, page);
				page.uploadAndVerifyFiles(['test-document.pdf', 'test-document.docx']);
				page.saveAndVerifyDocumentRow(
					examinationPage,
					() => examinationPage.examinationDetailsTable,
					'Map of proposed local plan policies',
					'test-document.pdf',
					'test-document.docx'
				);
			});
		}
	);

	it(
		'Downloads map of proposed local plan policies file when document link is clicked',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = mapOfProposedLocalPlanPoliciesPage;
				openExaminationDocumentUploadPage(plan, page);
				page.uploadAndVerifyFile('test-document.pdf');
				page.saveAndVerifyDownloadLink(
					examinationPage,
					() => examinationPage.examinationDetailsTable,
					'Map of proposed local plan policies',
					'test-document.pdf'
				);
			});
		}
	);

	it(
		'Adds a statement of compliance using drag and drop, then replaces it with new document',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = statementOfCompliancePage;
				openExaminationDocumentUploadPage(plan, page);
				page.dragAndDropAndVerifyFile('test-document.pdf');
				page.verifyReplaceFile(examinationPage, 'test-document.pdf', 'test-document.docx', 'goBack');
			});
		}
	);

	it('Shows both uploaded statement of compliance files on the examination page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = statementOfCompliancePage;
			openExaminationDocumentUploadPage(plan, page);
			page.uploadAndVerifyFiles(['test-document.pdf', 'test-document.docx']);
			page.saveAndVerifyDocumentRow(
				examinationPage,
				() => examinationPage.examinationDetailsTable,
				'Statement of compliance',
				'test-document.pdf',
				'test-document.docx'
			);
		});
	});

	it('Downloads statement of compliance file when document link is clicked', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = statementOfCompliancePage;
			openExaminationDocumentUploadPage(plan, page);
			page.uploadAndVerifyFile('test-document.docx');
			page.saveAndVerifyDownloadLink(
				examinationPage,
				() => examinationPage.examinationDetailsTable,
				'Statement of compliance',
				'test-document.docx'
			);
		});
	});
});
