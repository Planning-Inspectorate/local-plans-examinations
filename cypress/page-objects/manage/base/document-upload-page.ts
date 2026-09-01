import { BasePage } from '../../base-page.ts';
export class DocumentUploadPage extends BasePage {
	private readonly fieldName: string;
	private readonly heading: string;
	private readonly caption: string;

	constructor(path: string | RegExp, fieldName: string, heading: string, caption: string) {
		super(path);
		this.fieldName = fieldName;
		this.heading = heading;
		this.caption = caption;
	}

	uploadAndVerifyFile(fileName: string, fieldName: string) {
		this.dragAndDropFile(fileName, fieldName);
		this.clickUploadFiles();
		this.verifyFileUploaded(fileName);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(this.heading);
		this.verifyCaptionL(this.caption);
		this.chooseFilesButton(this.fieldName).should('be.visible');
	}
}
