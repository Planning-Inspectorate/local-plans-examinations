import { BasePage } from '../../base-page.ts';

const fieldID = 'examiningInspector1';

export class CaseOverviewExaminingInspector1Page extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/examining-inspector-1$/);
	}

	get examiningInspectorInputID() {
		return cy.get(`[id='${fieldID}']`);
	}

	enterInspectorName(inspectorName: string) {
		this.enterSmartLookUp(fieldID, inspectorName);
		super.saveAndContinue();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Which Inspector is assigned for Examination?');
		this.examiningInspectorInputID.should('be.visible');
		this.verifySaveAndContinueVisible();
	}
}
export const caseOverviewExaminingInspector1Page = new CaseOverviewExaminingInspector1Page();
