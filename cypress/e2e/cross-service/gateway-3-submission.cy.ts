import {
	submitGateway3InPortal,
	uploadGateway3DocumentInPortal
} from '../../flows/cross-service/gateway-3-submission-flow.ts';
import { openGateway3Page, openGateway3ReviewDocumentsPage } from '../../flows/manage/gateway-3-flow.ts';
import { manageToPortalLogin, THIRD_TEST_EMAIL } from '../../flows/portal/login-flow.ts';
import { gateway3DateAnswers, gateway3DocumentsAnswer } from '../../fixtures/manage/gateway-3.ts';
import { examinationWebsite } from '../../fixtures/portal/examination-website.ts';
import type { Gateway2ReportIssuedFixture } from '../../fixtures/portal/types.ts';
import { gateway3Page, gateway3ReviewDocumentsPage } from '../../page-objects/manage/gateway-3/index.ts';

const loadPlan = () => cy.fixture<Gateway2ReportIssuedFixture>('portal/gateway-2-report-issued.json');
const todayDisplay = new Date().toLocaleDateString('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'GMT'
});

describe('Cross-service Gateway 3 submission', () => {
	beforeEach(() => {
		cy.task('clearDb');
		cy.task('seedCase');
		loadPlan().then((plan) => cy.task('seedGateway3DeclarationDocuments', plan.reference));
	});

	after(() => cy.task('clearDb'));

	it('submits in Portal and makes the document available to review in Manage', { tags: ['regression'] }, () => {
		loadPlan().then((plan) => {
			const fileName = gateway3DocumentsAnswer.fileName2;
			openGateway3Page(plan.reference, plan.title);
			manageToPortalLogin(THIRD_TEST_EMAIL);
			uploadGateway3DocumentInPortal(plan.reference, fileName);

			openGateway3Page(plan.reference, plan.title);
			gateway3Page.verifyNoSubmissionDocumentsReviewLink();
			submitGateway3InPortal(plan.reference);

			openGateway3Page(plan.reference, plan.title);
			gateway3Page.verifySummaryRowContains(gateway3DateAnswers.gateway3ActualDate.row, todayDisplay);
			openGateway3ReviewDocumentsPage();
			gateway3ReviewDocumentsPage.verifyExaminationWebsiteLink(examinationWebsite.value, examinationWebsite.value);
			gateway3ReviewDocumentsPage.verifyDocumentDownload('Environmental report', fileName);
		});
	});
});
