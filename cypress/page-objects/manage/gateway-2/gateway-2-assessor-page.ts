import { SmartLookupPage } from '../base/index.ts';
import { gateway2AssessorAnswer } from '../../../fixtures/manage/gateway-2.ts';

export class Gateway2AssessorPage extends SmartLookupPage {
	constructor() {
		super(
			/^\/case\/.+\/gateway-2\/gateway-2\/gateway-2-assessor$/,
			gateway2AssessorAnswer.inputField,
			gateway2AssessorAnswer.heading
		);
	}

	enterAssessorName(assessorInput: string) {
		this.enterLookupAnswer(assessorInput);
	}

	assessorNamePopulated(item: string) {
		this.verifyLookupAnswer(item);
	}

	clearAssessorNameField() {
		this.clearLookupAnswer();
	}
}
export const gateway2AssessorPage = new Gateway2AssessorPage();
