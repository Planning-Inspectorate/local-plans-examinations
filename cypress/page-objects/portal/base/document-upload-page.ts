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

	dragAndDropFile(fileName: string) {
		super.dragAndDropFile(fileName, this.fieldName);
	}

	uploadFile(fileName: string | string[]) {
		super.uploadFile(this.fieldName, fileName);
	}

	verifyNoFileChosen() {
		super.verifyNoFileChosen(this.fieldName);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(this.heading);
		this.verifyCaptionL(this.caption);
		this.chooseFilesButton(this.fieldName).should('be.visible');
	}
}
