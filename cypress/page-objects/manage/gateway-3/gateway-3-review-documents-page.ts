import { BasePage } from '../../base-page.ts';
import {
	gateway3DecisionAnswer,
	gateway3ExaminationWebsiteDocumentLabel,
	gateway3MissingDocumentError,
	gateway3OptionalSubmissionDocumentLabels,
	gateway3RequiredSubmissionDocuments,
	gateway3ReviewDocumentsAnswer
} from '../../../fixtures/manage/gateway-3.ts';

const gateway3SubmissionPath = (path: string) =>
	new RegExp(`^/case/.+/gateway-3/gateway-3-submission-(\\d+)/${path}-(\\d+)$`);

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Some labels are prefixes of others (e.g. "Summary of consultation on proposed local plan"), so match the whole key
const exactText = (text: string) => new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`);

class Gateway3ReviewDocumentsPage extends BasePage {
	constructor() {
		super(gateway3SubmissionPath(gateway3ReviewDocumentsAnswer.path));
	}

	get issueDecisionButton() {
		return cy.getByData('issue-decision-button');
	}

	get requiredDocumentsSection() {
		return cy.get(`#${gateway3ReviewDocumentsAnswer.requiredSection.id}`);
	}

	get optionalDocumentsSection() {
		return cy.get(`#${gateway3ReviewDocumentsAnswer.optionalSection.id}`);
	}

	get missingDocumentErrorSummary() {
		return cy.getByData('error-summary');
	}

	missingDocumentErrorLink(documentLabel: string) {
		return this.errorSummaryList.contains('a', gateway3MissingDocumentError(documentLabel));
	}

	documentRow(documentLabel: string) {
		return cy.contains('.govuk-summary-list__key', exactText(documentLabel)).parent('.govuk-summary-list__row');
	}

	verifyLoaded(reference?: string) {
		super.verifyLoaded();
		this.verifyHeading(gateway3ReviewDocumentsAnswer.heading);
		this.verifySubHeading(gateway3ReviewDocumentsAnswer.requiredSection.heading);
		this.verifySubHeading(gateway3ReviewDocumentsAnswer.optionalSection.heading);
		this.issueDecisionButton.should('be.visible');
		if (reference) {
			this.verifyCaptionL(reference);
		}
	}

	verifyDocumentSections() {
		const { requiredSection, optionalSection } = gateway3ReviewDocumentsAnswer;
		this.requiredDocumentsSection
			.should('be.visible')
			.and('contain.text', requiredSection.heading)
			.and('contain.text', requiredSection.description);
		this.optionalDocumentsSection
			.should('be.visible')
			.and('contain.text', optionalSection.heading)
			.and('contain.text', optionalSection.description);
	}

	verifyDocumentRowsInSections() {
		const requiredDocumentLabels = [
			gateway3ExaminationWebsiteDocumentLabel,
			...gateway3RequiredSubmissionDocuments.map(({ label }) => label)
		];
		requiredDocumentLabels.forEach((documentLabel) => {
			this.requiredDocumentsSection.contains('.govuk-summary-list__key', exactText(documentLabel)).should('exist');
		});
		gateway3OptionalSubmissionDocumentLabels.forEach((documentLabel) => {
			this.optionalDocumentsSection.contains('.govuk-summary-list__key', exactText(documentLabel)).should('exist');
		});
	}

	verifyDocumentAdded(documentLabel: string, fileName: string) {
		this.documentRow(documentLabel).find('.govuk-summary-list__value').should('contain.text', fileName);
	}

	verifyDocumentNotAdded(documentLabel: string) {
		this.documentRow(documentLabel)
			.find('.govuk-summary-list__value')
			.should('contain.text', gateway3ReviewDocumentsAnswer.notAddedDisplay);
	}

	documentViewLinks(documentLabel: string) {
		return this.documentRow(documentLabel).find('[data-cy="view-document-link"]');
	}

	// Filename and View links must point to the same document.
	verifyDocumentDownloadLinks(documentLabel: string, ...fileNames: string[]) {
		this.documentViewLinks(documentLabel).should('have.length', fileNames.length);
		fileNames.forEach((fileName) => {
			this.documentRow(documentLabel)
				.contains('[data-cy="view-document-link"]', fileName)
				.should('be.visible')
				.and('contain.text', gateway3ReviewDocumentsAnswer.viewLinkText)
				.and('have.attr', 'href')
				.and('match', /^\/case\/.+\/download-case-document\/.+$/)
				.then((href) => {
					const fileLink = this.documentRow(documentLabel)
						.find('.govuk-summary-list__value')
						.contains('a', exactText(fileName));
					this.verifySummaryRowActionHref(documentLabel, String(href), fileLink);
				});
		});
	}

	verifyNoDocumentViewLink(documentLabel: string) {
		this.documentViewLinks(documentLabel).should('not.exist');
	}

	verifyDocumentDownload(documentLabel: string, fileName: string) {
		this.verifyDocumentDownloadLinks(documentLabel, fileName);
		this.documentRow(documentLabel)
			.find('.govuk-summary-list__value')
			.contains('a', exactText(fileName))
			.invoke('attr', 'href')
			.then((href) => {
				cy.fixture(`files/${fileName}`, 'binary').then((contents) => {
					cy.request({ url: String(href), encoding: 'binary' }).then((response) => {
						expect(response.status).to.equal(200);
						expect(response.headers['content-disposition']).to.include('attachment').and.include(fileName);
						expect(response.body).to.equal(contents);
					});
				});
			});
	}

	verifyExaminationWebsiteLink(text: string, href: string) {
		this.documentRow(gateway3ExaminationWebsiteDocumentLabel)
			.find('[data-cy="examination-website-link"]')
			.should('be.visible')
			.and('have.text', text)
			.and('have.attr', 'target', '_blank')
			.and('have.attr', 'href', href);
	}

	verifyIssueDecisionHref() {
		this.issueDecisionButton
			.should('have.attr', 'href')
			.and('match', new RegExp(`/gateway-3/gateway-3-submission-(\\d+)/${gateway3DecisionAnswer.path}-(\\d+)$`));
	}

	issueDecision() {
		this.issueDecisionButton.should('be.visible').click();
	}

	verifyMissingDocumentErrors(...missingDocumentLabels: string[]) {
		this.missingDocumentErrorSummary
			.should('be.visible')
			.and('contain.text', gateway3ReviewDocumentsAnswer.errorSummaryTitle);
		this.errorSummaryList.find('a').should('have.length', missingDocumentLabels.length);
		missingDocumentLabels.forEach((documentLabel) => {
			this.missingDocumentErrorLink(documentLabel).should('be.visible');
		});
	}

	verifyNoMissingDocumentErrorFor(...addedDocumentLabels: string[]) {
		addedDocumentLabels.forEach((documentLabel) => {
			this.errorSummaryList.should('not.contain.text', gateway3MissingDocumentError(documentLabel));
		});
	}

	verifyNoMissingDocumentErrors() {
		this.missingDocumentErrorSummary.should('not.exist');
	}

	verifyMissingDocumentErrorLinksToRow(documentLabel: string) {
		this.missingDocumentErrorLink(documentLabel)
			.invoke('attr', 'href')
			.then((errorHref) => {
				expect(errorHref, `error link for "${documentLabel}"`).to.match(/^#document-/);
				cy.get(String(errorHref))
					.should('have.text', documentLabel)
					.closest('.govuk-summary-list__key')
					.should('exist')
					.closest(`#${gateway3ReviewDocumentsAnswer.requiredSection.id}`)
					.should('exist');
			});
	}

	followMissingDocumentErrorLink(documentLabel: string) {
		this.missingDocumentErrorLink(documentLabel)
			.invoke('attr', 'href')
			.then((errorHref) => {
				this.missingDocumentErrorLink(documentLabel).click();
				cy.location('hash').should('eq', errorHref);
				cy.get(String(errorHref)).should('be.visible');
			});
	}
}

export const gateway3ReviewDocumentsPage = new Gateway3ReviewDocumentsPage();
