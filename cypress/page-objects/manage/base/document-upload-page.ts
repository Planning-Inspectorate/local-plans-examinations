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

	get chooseFilesButton() {
		return cy.get(`#${this.fieldName}`);
	}

	get uploadFilesButton() {
		return cy.getByData('upload-files-button');
	}

	get saveAndReturnButton() {
		return cy.getByData('save-and-return-button');
	}

	clickUploadFiles() {
		this.uploadFilesButton.should('be.visible').click();
	}

	saveAndReturn() {
		this.saveAndReturnButton.should('be.visible').click();
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
}
