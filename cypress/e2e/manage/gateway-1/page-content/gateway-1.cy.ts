import { openSeededGateway1Page } from '../../../../flows/manage/gateway-1-flow.ts';
import { gateway1Page } from '../../../../page-objects/manage/gateway-1/index.ts';

describe('Gateway 1 page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it('displays the Gateway 1 tab content for a case', () => {
		openSeededGateway1Page();

		gateway1Page.verifyBackLink('/');
		gateway1Page.verifySectionHeading('Gateway 1');
		gateway1Page.verifyExpectedRows();
		gateway1Page.verifyExpectedSeededAnswers();
		gateway1Page.verifyExpectedActionLinkHrefs();
	});
});
