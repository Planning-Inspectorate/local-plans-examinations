import { gateway3Page, gateway3ReviewDocumentsPage } from '../../page-objects/manage/gateway-3/index.ts';
import { gateway3ReviewDocumentsAnswer } from '../../fixtures/manage/gateway-3.ts';
import { openManageCase, openSeededManageCase, type SeededManageCase } from './seeded-case-flow.ts';
import type { Gateway3SubmissionDocumentsSeedOptions } from '../../tasks/gateway-3.ts';

export const openSeededGateway3Page = () => {
	return openSeededManageCase().then(({ planTitle }) => {
		gateway3Page.openServiceNavigationItem('Gateway 3');
		gateway3Page.verifyLoaded(planTitle);
	});
};

export const openGateway3Page = (seededManageCase: SeededManageCase) => {
	return openManageCase(seededManageCase).then(({ planTitle }) => {
		gateway3Page.openServiceNavigationItem('Gateway 3');
		gateway3Page.verifyLoaded(planTitle);
	});
};

export const openSeededGateway3PageWithSubmissionDocuments = (options: Gateway3SubmissionDocumentsSeedOptions = {}) => {
	return cy.task<SeededManageCase>('seedGateway3SubmissionDocuments', options).then((seededCase) => {
		openGateway3Page(seededCase);
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
