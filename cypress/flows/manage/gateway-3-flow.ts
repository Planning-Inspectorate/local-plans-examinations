import { gateway3ReviewDocumentsAnswer } from '../../fixtures/manage/gateway-3.ts';
import type { Gateway3SubmissionDocumentsSeedOptions } from '../../tasks/gateway-3.ts';
import {
	gateway3Page,
	gateway3DecisionPage,
	gateway3DocumentsPage,
	gateway3DocumentsCheckPage,
	gateway3ReviewDocumentsPage
} from '../../page-objects/manage/gateway-3/index.ts';
import { gateway3DecisionAnswer, gateway3DocumentsAnswer } from '../../fixtures/manage/gateway-3.ts';
import type { SeededManageCase } from './seeded-case-flow.ts';
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

export const openSeededGateway3PageWithSubmissionDocuments = (options: Gateway3SubmissionDocumentsSeedOptions = {}) => {
	return cy.task<SeededManageCase>('seedGateway3SubmissionDocuments', options).then((seededCase) => {
		openGateway3Page(seededCase.reference, seededCase.planTitle);
		return cy.wrap(seededCase, { log: false });
	});
};

export const openGateway3ReviewDocumentsPage = () => {
	gateway3Page.openActionLinkFor(gateway3ReviewDocumentsAnswer.row);
	gateway3ReviewDocumentsPage.verifyLoaded();
};

// The Review link has no text until documents are added, so open the review page from the Gateway 3 tab URL
export const visitGateway3ReviewDocumentsPage = (submissionNumber = 1) => {
	cy.location('pathname').then((gateway3TabPath) => {
		const submissionSection = `gateway-3-submission-${submissionNumber}`;
		cy.visit(`${gateway3TabPath}/${submissionSection}/${gateway3ReviewDocumentsAnswer.path}-${submissionNumber}`);
	});
	gateway3ReviewDocumentsPage.verifyLoaded();
};

// Issue decision checks the required submission documents before the decision page opens
export const requestGateway3DecisionWithMissingDocuments = () => {
	visitGateway3ReviewDocumentsPage();
	gateway3ReviewDocumentsPage.issueDecision();
	gateway3ReviewDocumentsPage.verifyLoaded();
};
