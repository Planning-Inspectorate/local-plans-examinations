import { PortalPlanBasePage } from '../../../page-objects/portal/base/portal-plan-page.ts';
export class DocumentUploadPage extends PortalPlanBasePage {
	private readonly fieldName: string;
	private readonly heading: string;
	private readonly caption: string;
	private readonly section: string;
	private readonly docPath: string;
	readonly addCy: string;

	constructor(
		path: string | RegExp,
		fieldName: string,
		heading: string,
		caption: string,
		addCy: string,
		section: string,
		docPath: string
	) {
		super(path);
		this.fieldName = fieldName;
		this.heading = heading;
		this.caption = caption;
		this.addCy = addCy;
		this.section = section;
		this.docPath = docPath;
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-2-submission/${this.section}/${this.docPath}`;
	}

	get fileInput() {
		return cy.get(`#${this.fieldName}-input`);
	}

	get chooseFilesButton() {
		return cy.get(`#${this.fieldName}`);
	}

	get uploadStatusText() {
		return this.chooseFilesButton.find('.govuk-file-upload-button__status');
	}

	get chooseFilesButtonLabel() {
		return this.chooseFilesButton.find('.govuk-file-upload-button__pseudo-button');
	}

	get dropInstructionText() {
		return this.chooseFilesButton.find('.govuk-file-upload-button__instruction');
	}

	get uploadedFileNames() {
		return cy.get('.govuk-summary-list__value');
	}

	get uploadFilesButton() {
		return cy.getByData('upload-files-button');
	}

	get saveAndReturnButton() {
		return cy.getByData('save-and-return-button');
	}

	get removeButton() {
		return cy.getByData('remove-file-button');
	}

	get hintText() {
		return cy.getByData('file-requirements-hint');
	}

	get uploadForm() {
		return cy.getByData('upload-form');
	}

	clickUploadFiles() {
		this.uploadFilesButton.should('be.visible').click();
	}

	verifyUploadFormVisible() {
		this.uploadForm.should('be.visible');
	}

	removeFile() {
		this.removeButton.should('be.visible').click();
	}

	verifyFileNotUploaded(fileName: string) {
		this.mainContent.should('not.contain.text', fileName);
	}

	uploadFile(fileNames: string | string[]) {
		const files = Array.isArray(fileNames) ? fileNames : [fileNames];
		this.fileInput.selectFile(
			files.map((fileName) => `cypress/fixtures/portal/files/${fileName}`),
			{ force: true }
		);
	}

	verifyFileFormatHintText() {
		this.hintText.should(
			'have.text',
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.'
		);
	}

	dragAndDropFile(fileName: string) {
		this.chooseFilesButton.selectFile(`cypress/fixtures/portal/files/${fileName}`, { action: 'drag-drop' });
	}

	verifySaveAndReturnButton() {
		this.saveAndReturnButton.should('be.visible').and('have.attr', 'type', 'submit');
	}

	saveAndReturn() {
		this.saveAndReturnButton.should('be.visible').click();
	}

	verifyFileUploaded(...fileNames: string[]) {
		fileNames.forEach((fileName) => {
			this.uploadedFileNames.should('contain.text', fileName);
		});
	}

	verifyCaption(text: string) {
		cy.get('.govuk-caption-l').should('be.visible').and('contain.text', text);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(this.heading);
		this.verifyCaption(this.caption);
		this.chooseFilesButton.should('be.visible');
	}

	verifyUploadFilesButtonVisible() {
		this.uploadFilesButton.should('be.visible');
	}

	verifyNoFileChosen() {
		this.chooseFilesButton.should('be.visible');
		this.uploadStatusText.should('have.text', 'No file chosen');
		this.chooseFilesButtonLabel.should('contain.text', 'Choose files');
		this.dropInstructionText.should('contain.text', 'or drop files');
	}
}
