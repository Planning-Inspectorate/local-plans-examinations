import {
	openGateway3ReviewDocumentsPage,
	openSeededGateway3Page,
	openSeededGateway3PageWithSubmissionDocuments
} from '../../../../flows/manage/gateway-3-flow.ts';
import { gateway3RequiredSubmissionDocuments } from '../../../../fixtures/manage/gateway-3.ts';
import { gateway3Page, gateway3ReviewDocumentsPage } from '../../../../page-objects/manage/gateway-3/index.ts';

describe('Gateway 3 page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it('displays the Gateway 3 tab content for a case', { tags: ['smoke', 'regression'] }, () => {
		openSeededGateway3Page();

		gateway3Page.verifyBackLink('/');
		gateway3Page.verifySectionHeading('Gateway 3');
		gateway3Page.verifySectionHeading('Gateway 3 submission');
		gateway3Page.verifyExpectedRows();
		gateway3Page.verifyExpectedSeededAnswers();
		gateway3Page.verifyExpectedActionLinkHrefs();
	});

	it('displays the submission documents count and Review link on the Gateway 3 tab', { tags: ['regression'] }, () => {
		openSeededGateway3PageWithSubmissionDocuments();

		gateway3Page.verifySubmissionDocumentsReviewLink(gateway3RequiredSubmissionDocuments.length);
	});

	it('displays the review documents page content', { tags: ['regression'] }, () => {
		openSeededGateway3PageWithSubmissionDocuments().then(({ reference }) => {
			openGateway3ReviewDocumentsPage();

			gateway3ReviewDocumentsPage.verifyLoaded(reference);
			gateway3ReviewDocumentsPage.verifyDocumentSections();
			gateway3ReviewDocumentsPage.verifyDocumentRowsInSections();
			gateway3ReviewDocumentsPage.verifyIssueDecisionHref();
		});
	});
});
