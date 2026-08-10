import { BasePage } from '../../base-page.ts';

const fieldID = 'qaInspector3';

export class CaseOverviewQAInspector3Page extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/qa-inspector-3$/);
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

export const caseOverviewQAInspector3Page = new CaseOverviewQAInspector3Page();
