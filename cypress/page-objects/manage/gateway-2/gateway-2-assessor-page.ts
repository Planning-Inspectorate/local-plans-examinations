import { BasePage } from '../../base-page.ts';
import { gateway2AssessorAnswer } from '../../../fixtures/manage/gateway-2.ts';

export class Gateway2AssessorPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-2\/gateway-2\/gateway-2-assessor$/);
	}

	enterAssessorName(assessorInput: string) {
		this.enterSmartLookUp(gateway2AssessorAnswer.inputField, assessorInput);
		super.saveAndContinue();
	}

	assessorNamePopulated(item: string) {
		this.smartLookUpPopulated(gateway2AssessorAnswer.inputField, item);
	}

	clearAssessorNameField() {
		cy.get(`[id='${gateway2AssessorAnswer.inputField}']`).clear();
	}

	verifyLoaded(planTitle?: string) {
		super.verifyLoaded();
		if (planTitle) {
			this.verifyHeading(planTitle);
		}
	}
}
export const gateway2AssessorPage = new Gateway2AssessorPage();
