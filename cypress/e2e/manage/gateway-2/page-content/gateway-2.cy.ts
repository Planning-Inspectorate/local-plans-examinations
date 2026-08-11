import { openSeededGateway2Page } from '../../../../flows/manage/gateway-2-flow.ts';
import { gateway2Page } from '../../../../page-objects/manage/gateway-2/index.ts';

describe('Gateway 2 page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it('displays the Gateway 2 tab content for a case', { tags: ['smoke', 'regression'] }, () => {
		openSeededGateway2Page();

		gateway2Page.verifyBackLink('/');
		gateway2Page.verifySectionHeading('Gateway 2');
		gateway2Page.verifyExpectedRows();
		gateway2Page.verifyExpectedSeededAnswers();
		gateway2Page.verifyExpectedActionLinkHrefs();
	});
});
