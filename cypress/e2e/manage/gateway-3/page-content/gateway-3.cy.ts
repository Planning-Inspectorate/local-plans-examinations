import { openSeededGateway3Page } from '../../../../flows/manage/gateway-3-flow.ts';
import { gateway3Page } from '../../../../page-objects/manage/gateway-3/index.ts';

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
});
