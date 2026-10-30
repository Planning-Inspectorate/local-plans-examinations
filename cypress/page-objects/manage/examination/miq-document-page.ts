import { BasePage } from '../../base-page.ts';
import { DocumentUploadPage } from '../base/index.ts';

import { MIQcheckPage } from '../../../fixtures/manage/examination.ts';

const outcomePath = '^/case/.+/examination/hearings/';

export const examinationMIQUploadPage = new DocumentUploadPage(
	new RegExp(`${outcomePath}miqs$`),
	'miqs',
	'Upload MIQ documents',
	'MIQs'
);

class ExaminationMIQCheckPage extends BasePage {
	constructor() {
		super(new RegExp(`${outcomePath}${MIQcheckPage.path}/check$`));
	}

	get confirmButton() {
		return cy.getByData(MIQcheckPage.fieldname);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(MIQcheckPage.heading);
		this.confirmButton.should('be.visible');
	}

	verifyDocuments(...fileNames: string[]) {
		this.verifyLoaded();
		fileNames.forEach((fileName, index) => this.verifySummaryRowContains(`Document ${index + 1}`, fileName));
	}

	confirm() {
		this.verifyLoaded();
		this.confirmButton.click();
	}
}

export const examinationMIQCheckPage = new ExaminationMIQCheckPage();
