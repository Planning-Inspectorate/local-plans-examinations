import { BasePage } from '../../base-page.ts';

const fieldID = 'qaInspector1';

export class CaseOverviewQAInspector1Page extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/qa-inspector-1$/);
	}

	get qaInspectorNameInputID() {
		return cy.get(`[id='${fieldID}']`);
	}

	enterQAInspectorName(inspectorName: string) {
		this.enterSmartLookUp(fieldID, inspectorName);
		super.saveAndContinue();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Which Inspector is assigned for QA?');
		this.qaInspectorNameInputID.should('be.visible');
		this.verifySaveAndContinueVisible();
	}
}

export const caseOverviewQAInspector1Page = new CaseOverviewQAInspector1Page();
