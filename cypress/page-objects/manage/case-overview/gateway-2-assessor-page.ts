import { BasePage } from '../../base-page.ts';

const fieldID = 'assessorName';

export class CaseOverviewGateway2AssessorPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/assessor-gateway-2$/);
	}

	get assessorInputID() {
		return cy.get(`[id='${fieldID}']`);
	}

	enterAssessorName(assessorName: string) {
		this.enterSmartLookUp(fieldID, assessorName);
		super.saveAndContinue();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Who is the Gateway 2 assessor?');
		this.assessorInputID.should('be.visible');
		this.verifySaveAndContinueVisible();
	}
}

export const caseOverviewGateway2AssessorPage = new CaseOverviewGateway2AssessorPage();
