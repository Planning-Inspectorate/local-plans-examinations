import { BasePage } from '../../base-page.ts';

const fieldID = 'examiningInspector2';

export class CaseOverviewExaminingInspector2Page extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/examining-inspector-2$/);
	}

	get examiningInspectorInputID() {
		return cy.get(`[id='${fieldID}']`);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Which Inspector is assigned for Examination?');
		this.examiningInspectorInputID.should('be.visible');
		this.verifySaveAndContinueVisible();
	}
}
export const caseOverviewExaminingInspector2Page = new CaseOverviewExaminingInspector2Page();
