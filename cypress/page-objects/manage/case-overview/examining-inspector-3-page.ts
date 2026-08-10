import { BasePage } from '../../base-page.ts';

const fieldID = 'examiningInspector3';

export class CaseOverviewExaminingInspector3Page extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/examining-inspector-3$/);
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
export const caseOverviewExaminingInspector3Page = new CaseOverviewExaminingInspector3Page();
