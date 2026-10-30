import {
	gateway3Page,
	gateway3DecisionPage,
	gateway3DocumentsPage,
	gateway3DocumentsCheckPage
} from '../../page-objects/manage/gateway-3/index.ts';
import { gateway3DecisionAnswer, gateway3DocumentsAnswer } from '../../fixtures/manage/gateway-3.ts';
import { openSeededManageCase } from './seeded-case-flow.ts';

export const openSeededGateway3Page = () => {
	return openSeededManageCase().then(({ planTitle }) => {
		gateway3Page.openServiceNavigationItem('Gateway 3');
		gateway3Page.verifyLoaded(planTitle);
	});
};

export const openGateway3Page = (reference: string, planTitle: string) => {
	cy.visit(`/case/${encodeURIComponent(reference)}/gateway-3`);
	gateway3Page.verifyLoaded(planTitle);
};

export const issueGateway3ProceedDecision = (planTitle: string) => {
	gateway3Page.openActionLinkFor(gateway3DecisionAnswer.row);
	gateway3DecisionPage.verifyLoaded();
	gateway3DecisionPage.selectDecision('Proceed');

	gateway3DocumentsPage.verifyLoaded();
	gateway3DocumentsPage.uploadAndVerifyFile(gateway3DocumentsAnswer.fileName);
	gateway3DocumentsPage.saveAndReturn();

	gateway3DocumentsCheckPage.verifyLoaded([gateway3DocumentsAnswer.fileName], 'Proceed to examination');
	gateway3DocumentsCheckPage.issueDecision();

	gateway3Page.verifyLoaded(planTitle);
};
