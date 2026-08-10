import { BasePage } from '../../base-page.ts';

const fieldID = 'qaInspector2';

export class CaseOverviewQAInspector2Page extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/qa-inspector-2$/);
	}

	get qaInspectorNameInputID() {
		return cy.get(`[id='${fieldID}']`);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Which Inspector is assigned for QA?');
		this.qaInspectorNameInputID.should('be.visible');
		this.verifySaveAndContinueVisible();
	}
}

export const caseOverviewQAInspector2Page = new CaseOverviewQAInspector2Page();
