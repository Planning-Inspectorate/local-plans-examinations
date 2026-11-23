import { BasePage } from '../../base-page.ts';
import { examinationDocuments } from '../../../fixtures/manage/examination.ts';

const downloadHref = /^\/case\/.+\/download-case-document\/.+$/;

type DocumentGroup = 'required' | 'other';

export class ExaminationDocumentsPage extends BasePage {
	constructor() {
		super(new RegExp(`^/case/.+/examination/examination/${examinationDocuments.path}$`));
	}

	documentGroup(group: DocumentGroup) {
		return cy.get(`#${group}-documents`);
	}

	get examinationWebsiteLink() {
		return cy.getByData('examination-website-link');
	}

	documentLink(label: string, fileName: string) {
		return this.summaryRowValue(label).contains('[data-cy="examination-document-link"]', fileName);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(examinationDocuments.heading);
		this.documentGroup('required').contains('h2', 'Required').should('be.visible');
		this.documentGroup('other').contains('h2', 'Other').should('be.visible');
		this.verifyBackLink();
	}

	verifyExaminationWebsite(text: string, href: string) {
		this.documentGroup('required').within(() => {
			this.examinationWebsiteLink.should('be.visible').and('have.text', text).and('have.attr', 'href', href);
		});
	}

	// Each uploaded document is a link that downloads the file
	verifyDocuments(group: DocumentGroup, documents: ReadonlyArray<{ label: string; fileName: string }>) {
		this.documentGroup(group).within(() => {
			documents.forEach(({ label, fileName }) => {
				this.documentLink(label, fileName).should('be.visible').and('have.attr', 'download');
				this.documentLink(label, fileName).should('have.attr', 'href').and('match', downloadHref);
			});
		});
	}

	verifyDocumentDownload(group: DocumentGroup, label: string, fileName: string) {
		this.verifyDocuments(group, [{ label, fileName }]);
		this.documentGroup(group).within(() => {
			this.verifyFileDownload(this.documentLink(label, fileName), fileName);
		});
	}

	verifyDocumentNotProvided(group: DocumentGroup, label: string) {
		this.documentGroup(group).within(() => {
			this.verifySummaryRowContains(label, 'Not provided');
		});
	}
}

export const examinationDocumentsPage = new ExaminationDocumentsPage();
