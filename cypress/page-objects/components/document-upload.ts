export class DocumentUpload {
	private readonly fieldName: string;

	constructor(fieldName: string) {
		this.fieldName = fieldName;
	}

	get chooseFilesButton() {
		return cy.get(`#${this.fieldName}`);
	}

	get uploadFilesButton() {
		return cy.getByData('upload-files-button');
	}

	get saveAndReturnButton() {
		return cy.getByData('save-and-return-button');
	}

	get hintText() {
		return cy.getByData('file-requirements-hint');
	}

	get uploadForm() {
		return cy.getByData('upload-form');
	}

	dragAndDropFile(fileName: string) {
		this.chooseFilesButton.selectFile(`cypress/fixtures/files/${fileName}`, {
			action: 'drag-drop'
		});
	}

	uploadFile(fileNames: string | string[]) {
		const files = Array.isArray(fileNames) ? fileNames : [fileNames];
		cy.get(`#${this.fieldName}-input`).selectFile(
			files.map((fileName) => `cypress/fixtures/files/${fileName}`),
			{ force: true }
		);
	}

	removeFile(fileName: string) {
		cy.contains('.govuk-summary-list', fileName).find("[data-cy='remove-file-button']").should('be.visible').click();
	}

	verifyFileUploaded(...fileNames: string[]) {
		fileNames.forEach((fileName) => {
			cy.get('.govuk-summary-list__value').should('contain', fileName);
		});
	}

	verifyFileNotUploaded(fileName: string) {
		cy.get('main').should('not.contain.text', fileName);
	}

	clickUploadFiles() {
		this.uploadFilesButton.should('be.visible').click();
	}

	verifyUploadFormVisible() {
		this.uploadForm.should('be.visible');
	}

	verifyUploadFilesButtonVisible() {
		this.uploadFilesButton.should('be.visible');
	}

	verifyFileFormatHintText(text: string) {
		this.hintText.should('have.text', text);
	}

	verifySaveAndReturnButton() {
		this.saveAndReturnButton.should('be.visible').and('have.attr', 'type', 'submit');
	}

	saveAndReturn() {
		this.saveAndReturnButton.should('be.visible').click();
	}

	verifyNoFileChosen() {
		this.chooseFilesButton.should('be.visible');
		this.chooseFilesButton.find('.govuk-file-upload-button__status').should('have.text', 'No file chosen');
		this.chooseFilesButton.find('.govuk-file-upload-button__pseudo-button').should('contain.text', 'Choose files');
		this.chooseFilesButton.find('.govuk-file-upload-button__instruction').should('contain.text', 'or drop files');
	}
}
