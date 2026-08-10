import { BasePage } from '../../base-page.ts';

const fieldID = 'assessorGateway3';
const listBoxID = 'assessorGateway3__listbox';

export class CaseOverviewGateway3AssessorPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/assessor-gateway-3$/);
	}

	get assessorInputID() {
		return cy.get(`[id='${fieldID}']`);
	}

	enterAssessorName(assessorName: string) {
		this.enterSmartLookUp(fieldID, listBoxID, assessorName);
		super.saveAndContinue();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Who is the Gateway 3 assessor?');
		this.assessorInputID.should('be.visible');
		this.verifySaveAndContinueVisible();
	}
}

export const caseOverviewGateway3AssessorPage = new CaseOverviewGateway3AssessorPage();
