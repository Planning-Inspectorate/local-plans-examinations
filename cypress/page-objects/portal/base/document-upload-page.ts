import { PortalPlanBasePage } from '../../../page-objects/portal/base/portal-plan-page.ts';
import { ERROR_MESSAGES } from '../../../constants/portal/error-messages.ts';
import { DocumentUpload } from '../../components/document-upload.ts';

export class DocumentUploadPage extends PortalPlanBasePage {
	private readonly heading: string;
	private readonly caption: string;
	private readonly section: string;
	private readonly docPath: string;
	private readonly documentUpload: DocumentUpload;
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
		this.heading = heading;
		this.caption = caption;
		this.addCy = addCy;
		this.section = section;
		this.docPath = docPath;
		this.documentUpload = new DocumentUpload(fieldName);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-2-submission/${this.section}/${this.docPath}`;
	}

	dragAndDropFile(fileName: string) {
		this.documentUpload.dragAndDropFile(fileName);
	}

	uploadFile(fileName: string | string[]) {
		this.documentUpload.uploadFile(fileName);
	}

	removeFile(fileName: string) {
		this.documentUpload.removeFile(fileName);
	}

	verifyFileUploaded(...fileNames: string[]) {
		this.documentUpload.verifyFileUploaded(...fileNames);
	}

	verifyFileNotUploaded(fileName: string) {
		this.documentUpload.verifyFileNotUploaded(fileName);
	}

	clickUploadFiles() {
		this.documentUpload.clickUploadFiles();
	}

	saveAndReturn() {
		this.documentUpload.saveAndReturn();
	}

	uploadAndVerifyFile(fileName: string) {
		this.uploadFile(fileName);
		this.clickUploadFiles();
		this.verifyFileUploaded(fileName);
	}

	verifyNoFileChosen() {
		this.documentUpload.verifyNoFileChosen();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(this.heading);
		this.verifyCaptionL(this.caption);
		this.documentUpload.chooseFilesButton.should('be.visible');
	}

	verifyPageContent(backLinkPath: string) {
		this.verifyLoaded();
		this.verifyBackLink(backLinkPath);
		this.verifyServiceNavigation('Guidance', 'Sign out');
		this.verifyMainContains('Drag and drop or choose files');
		this.verifyNoFileChosen();
		this.documentUpload.verifyUploadFormVisible();
		this.documentUpload.verifyFileFormatHintText(
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.'
		);
		this.documentUpload.verifyUploadFilesButtonVisible();
		this.documentUpload.verifySaveAndReturnButton();
	}

	dragAndDropAndVerifyFile(fileName: string) {
		this.dragAndDropFile(fileName);
		this.clickUploadFiles();
		this.verifyFileUploaded(fileName);
	}

	verifyReplaceFile(
		applicationPage: PortalPlanBasePage,
		originalFileName: string,
		replacementFileName: string,
		returnButton: 'goBack' | 'saveAndReturn' = 'saveAndReturn'
	) {
		if (returnButton === 'goBack') {
			this.goBack();
		} else {
			this.saveAndReturn();
		}

		applicationPage.verifyLoaded();
		applicationPage.clickAddLink(this.addCy);
		this.verifyLoaded();
		this.verifyFileUploaded(originalFileName);
		this.removeFile(originalFileName);
		this.verifyFileNotUploaded(originalFileName);
		this.uploadAndVerifyFile(replacementFileName);
	}

	uploadAndVerifyFiles(fileNames: string[]) {
		this.uploadFile(fileNames);
		this.clickUploadFiles();
		this.verifyFileUploaded(...fileNames);
	}

	saveAndVerifyDocumentRow(
		applicationPage: PortalPlanBasePage,
		table: () => Cypress.Chainable,
		documentLabel: string,
		...fileNames: string[]
	) {
		this.saveAndReturn();
		applicationPage.verifyLoaded();
		applicationPage.verifyDocumentRowContains(table(), documentLabel, ...fileNames);
	}

	saveAndVerifyDownloadLink(
		applicationPage: PortalPlanBasePage,
		table: () => Cypress.Chainable,
		documentLabel: string,
		fileName: string
	) {
		this.saveAndReturn();
		applicationPage.verifyLoaded();
		applicationPage.verifyDocumentDownloadLink(table(), documentLabel, fileName);
	}

	verifyInvalidFileTypeError() {
		this.uploadFile('test-document-invalid.txt');
		this.clickUploadFiles();
		this.verifyErrorSummary(ERROR_MESSAGES.THERE_IS_A_PROBLEM, ERROR_MESSAGES.INVALID_FILE_FORMAT);
	}

	verifyNoFileUploadedError() {
		this.clickUploadFiles();
		this.verifyErrorSummary(ERROR_MESSAGES.THERE_IS_A_PROBLEM, ERROR_MESSAGES.NO_FILE_UPLOADED);
	}
}
