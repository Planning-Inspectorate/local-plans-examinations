import {
	openSeededGateway3Page,
	openSeededGateway3PageWithSubmissionDocuments,
	requestGateway3DecisionWithMissingDocuments
} from '../../../../flows/manage/gateway-3-flow.ts';
import {
	gateway3DateAnswers,
	gateway3AssessorAnswer,
	gateway3ProgrammeOfficerAnswer,
	gateway3DecisionAnswer,
	gateway3RequiredSubmissionDocuments
} from '../../../../fixtures/manage/gateway-3.ts';
import {
	gateway3Page,
	gateway3ActualDatePage,
	gateway3AssessorPage,
	gateway3ProgrammeOfficerPage,
	gateway3DecisionPage,
	gateway3DocumentsPage,
	gateway3ReviewDocumentsPage
} from '../../../../page-objects/manage/gateway-3/index.ts';

const requiredDocumentLabels = gateway3RequiredSubmissionDocuments.map(({ label }) => label);

describe('Gateway 3 validation', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway3Page();
	});

	after(() => cy.task('clearDb'));

	it('shows an error when a Gateway 3 date is blank', { tags: ['regression'] }, () => {
		gateway3Page.openActionLinkFor(gateway3DateAnswers.gateway3ActualDate.row);
		gateway3ActualDatePage.verifyLoaded(gateway3DateAnswers.gateway3ActualDate.input);
		gateway3ActualDatePage.clearDate();
		gateway3ActualDatePage.saveAndContinue();

		gateway3ActualDatePage.verifyLoaded();
		//for valid date error messages, assertions need 2 spaces due to how the message is processed
		gateway3ActualDatePage.verifyValidationError('Enter  a valid date');
	});

	it('shows an error when Gateway 3 assessor name is blank', { tags: ['regression'] }, () => {
		gateway3Page.openActionLinkFor(gateway3AssessorAnswer.row);
		gateway3AssessorPage.verifyLoaded();
		gateway3AssessorPage.assessorNamePopulated(gateway3AssessorAnswer.assessor1);
		gateway3AssessorPage.clearAssessorNameField();
		gateway3AssessorPage.saveAndContinue();

		gateway3AssessorPage.verifyLoaded();
		gateway3AssessorPage.verifyValidationError('Select a name');
	});

	it('shows errors when the programme officer details are blank', { tags: ['regression'] }, () => {
		gateway3Page.openActionLinkFor(gateway3ProgrammeOfficerAnswer.row);
		gateway3ProgrammeOfficerPage.verifyLoaded(
			gateway3ProgrammeOfficerAnswer.firstName,
			gateway3ProgrammeOfficerAnswer.lastName,
			gateway3ProgrammeOfficerAnswer.email
		);
		gateway3ProgrammeOfficerPage.programmeOfficerFirstNameInput.clear();
		gateway3ProgrammeOfficerPage.programmeOfficerLastNameInput.clear();
		gateway3ProgrammeOfficerPage.programmeOfficerEmailInput.clear();
		gateway3ProgrammeOfficerPage.saveAndContinue();

		gateway3ProgrammeOfficerPage.verifyLoaded();
		gateway3ProgrammeOfficerPage.verifyValidationErrors(
			'Input a first name',
			'Input a last name',
			'Input an email address'
		);
	});

	it(
		'shows an error for each missing required document when a Gateway 3 decision is requested',
		{ tags: ['regression'] },
		() => {
			requestGateway3DecisionWithMissingDocuments();

			gateway3ReviewDocumentsPage.verifyMissingDocumentErrors(...requiredDocumentLabels);
		}
	);

	it('keeps the missing document errors when Issue decision is selected again', { tags: ['regression'] }, () => {
		requestGateway3DecisionWithMissingDocuments();

		gateway3ReviewDocumentsPage.issueDecision();

		gateway3ReviewDocumentsPage.verifyLoaded();
		gateway3ReviewDocumentsPage.verifyMissingDocumentErrors(...requiredDocumentLabels);
	});

	it('links each missing document error to its document row', { tags: ['regression'] }, () => {
		const lastRequiredDocumentLabel = requiredDocumentLabels[requiredDocumentLabels.length - 1];
		requestGateway3DecisionWithMissingDocuments();

		requiredDocumentLabels.forEach((documentLabel) => {
			gateway3ReviewDocumentsPage.verifyMissingDocumentErrorLinksToRow(documentLabel);
		});
		gateway3ReviewDocumentsPage.followMissingDocumentErrorLink(lastRequiredDocumentLabel);
	});

	it('clears the missing document errors when the review documents page is reloaded', { tags: ['regression'] }, () => {
		requestGateway3DecisionWithMissingDocuments();
		gateway3ReviewDocumentsPage.verifyMissingDocumentErrors(...requiredDocumentLabels);

		cy.reload();

		gateway3ReviewDocumentsPage.verifyLoaded();
		gateway3ReviewDocumentsPage.verifyNoMissingDocumentErrors();
	});
});

describe('Gateway 3 submission documents validation', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it('only shows errors for the required documents that are still missing', { tags: ['regression'] }, () => {
		const [missingProposedLocalPlan, missingMapOfPolicies, ...addedDocuments] = gateway3RequiredSubmissionDocuments;
		openSeededGateway3PageWithSubmissionDocuments({ documents: addedDocuments });

		requestGateway3DecisionWithMissingDocuments();

		gateway3ReviewDocumentsPage.verifyMissingDocumentErrors(missingProposedLocalPlan.label, missingMapOfPolicies.label);
		gateway3ReviewDocumentsPage.verifyNoMissingDocumentErrorFor(...addedDocuments.map(({ label }) => label));
		gateway3ReviewDocumentsPage.verifyDocumentNotAdded(missingProposedLocalPlan.label);
		gateway3ReviewDocumentsPage.verifyDocumentNotAdded(missingMapOfPolicies.label);
		addedDocuments.forEach(({ label, fileName }) => {
			gateway3ReviewDocumentsPage.verifyDocumentAdded(label, fileName);
		});
	});

	it('shows an error when the Gateway 3 report is not uploaded', { tags: ['regression'] }, () => {
		openSeededGateway3PageWithSubmissionDocuments();
		gateway3Page.openActionLinkFor(gateway3DecisionAnswer.row);
		gateway3DecisionPage.verifyLoaded();
		gateway3DecisionPage.selectDecision('Proceed');

		gateway3DocumentsPage.verifyLoaded();
		gateway3DocumentsPage.saveAndReturn();

		gateway3DocumentsPage.verifyLoaded();
		gateway3DocumentsPage.verifyValidationError('Please upload your Gateway 3 report');
		gateway3DocumentsPage.verifyErrorTitle();
	});
});
