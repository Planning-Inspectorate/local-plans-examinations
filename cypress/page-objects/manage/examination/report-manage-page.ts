import { BasePage } from '../../base-page.ts';
import { examinationReport } from '../../../fixtures/manage/examination.ts';

class ExaminationReportManagePage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/examination\/outcome\/examination-report-manage$/);
	}

	get documentsTable() {
		return cy.getByData('examination-report-documents');
	}

	get addDocumentButton() {
		return cy.getByData('add-document');
	}

	documentRow(fileName: string) {
		return this.documentsTable.contains('tr', fileName);
	}

	removeDocumentLink(fileName: string) {
		return this.documentRow(fileName).contains('a', 'Remove');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Manage report and main modifications');
		this.addDocumentButton.should('be.visible');
		this.documentsTable.should('be.visible');
	}

	verifyDocuments(...fileNames: string[]) {
		this.verifyLoaded();
		this.documentsTable.find('tbody tr').should('have.length', fileNames.length);
		fileNames.forEach((fileName) => this.documentRow(fileName).should('be.visible'));
	}

	verifyDocumentsContent(receivedDate: string, ...fileNames: string[]) {
		this.verifyDocuments(...fileNames);
		this.verifyTableHeaders(this.documentsTable, ['Document', 'Received', 'Actions']);
		this.addDocumentButton.invoke('prop', 'href').and('match', /\/examination\/outcome\/examination-report$/);
		fileNames.forEach((fileName) => {
			this.documentRow(fileName).should('contain.text', receivedDate);
			this.removeDocumentLink(fileName)
				.invoke('prop', 'href')
				.and('match', /\/examination-report\/remove\/examination%2F.+/);
		});
	}

	verifyDocumentsPersisted(...fileNames: string[]) {
		cy.reload();
		this.verifyDocuments(...fileNames);
	}

	verifyDocumentAdded(...fileNames: string[]) {
		this.verifyLoaded();
		this.verifyNotificationBanner(examinationReport.addedMessage);
		this.verifyDocumentsPersisted(...fileNames);
	}

	addDocument() {
		this.verifyLoaded();
		this.addDocumentButton.click();
	}

	removeDocument(fileName: string) {
		this.verifyLoaded();
		this.removeDocumentLink(fileName).click();
	}
}

export const examinationReportManagePage = new ExaminationReportManagePage();
