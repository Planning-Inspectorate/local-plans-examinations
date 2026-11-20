import { gateway3ReviewDocumentsAnswer } from '../../fixtures/manage/gateway-3.ts';
import type { Gateway3SubmissionDocumentsSeedOptions } from '../../tasks/gateway-3.ts';
import {
	gateway3Page,
	gateway3RemoveAssessorPage,
	gateway3DecisionPage,
	gateway3DocumentsPage,
	gateway3DocumentsCheckPage,
	gateway3ReviewDocumentsPage,
	gateway3Submission2DocumentsPage
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

/**
 * The seeded case already has a Gateway 3 assessor, so remove it to get back to the "Add assessor" link
 */
export const removeGateway3Assessor = (planTitle: string) => {
	gateway3Page.openRemoveAssessor();
	gateway3RemoveAssessorPage.confirmRemoval();

	gateway3Page.verifyLoaded(planTitle);
	gateway3Page.verifyNoAssessor();
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

// Issusing a proceed decision after the first resubmission
export const issueGateway3Submission2ProceedDecision = (planTitle: string, resubmittedFileName: string) => {
	cy.location('pathname').then((gateway3TabPath) => {
		cy.visit(`${gateway3TabPath}/gateway-3-submission-2/${gateway3ReviewDocumentsAnswer.path}-2`);
	});
	gateway3ReviewDocumentsPage.verifyHeading(gateway3ReviewDocumentsAnswer.heading);
	gateway3ReviewDocumentsPage.verifyDocumentAdded('New or updated documents', resubmittedFileName);
	gateway3ReviewDocumentsPage.issueDecision();

	gateway3DecisionPage.verifyLoaded();
	gateway3DecisionPage.selectDecision('Proceed');

	gateway3Submission2DocumentsPage.verifyLoaded();
	gateway3Submission2DocumentsPage.uploadAndVerifyFile(gateway3DocumentsAnswer.fileName);
	gateway3Submission2DocumentsPage.saveAndReturn();

	gateway3DocumentsCheckPage.verifyLoaded([gateway3DocumentsAnswer.fileName], 'Proceed to examination');
	gateway3DocumentsCheckPage.issueDecision();

	gateway3Page.verifyLoaded(planTitle);
};

export const issueGateway3ResubmissionDecision = (planTitle: string) => {
	gateway3Page.openActionLinkFor(gateway3DecisionAnswer.row);
	gateway3DecisionPage.verifyLoaded();
	gateway3DecisionPage.selectDecision('Resubmit');

	gateway3DocumentsPage.verifyLoaded();
	gateway3DocumentsPage.uploadAndVerifyFile(gateway3DocumentsAnswer.fileName);
	gateway3DocumentsPage.saveAndReturn();

	gateway3DocumentsCheckPage.verifyLoaded([gateway3DocumentsAnswer.fileName], 'Resubmission required');
	gateway3DocumentsCheckPage.issueDecision();

	gateway3Page.verifyLoaded(planTitle);
	gateway3Page.verifyGateway3SubmissionIssued('Resubmission required');
	gateway3Page.verifySubHeading('Gateway 3 submission 2');
	gateway3Page.verifyHeaderStatus('GW3 pending');
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

// Validation checks can open the review page directly before a submission has been received.
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
