import { BasePage } from '../../base-page.ts';
import { DocumentUpload } from '../../components/document-upload.ts';

export class DocumentUploadPage extends BasePage {
	private readonly heading: string;
	private readonly caption: string;
	private readonly documentUpload: DocumentUpload;

	constructor(path: string | RegExp, fieldName: string, heading: string, caption: string) {
		super(path);
		this.heading = heading;
		this.caption = caption;
		this.documentUpload = new DocumentUpload(fieldName);
	}

	dragAndDropFile(fileName: string) {
		this.documentUpload.dragAndDropFile(fileName);
	}

	removeFile(fileName: string) {
		this.documentUpload.removeFile(fileName);
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
		this.dragAndDropFile(fileName);
		this.clickUploadFiles();
		this.documentUpload.verifyFileUploaded(fileName);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(this.heading);
		this.verifyCaptionL(this.caption);
		this.documentUpload.chooseFilesButton.should('be.visible');
	}
}
