import { SmartLookupPage } from '../base/index.ts';
import { gateway3AssessorAnswer } from '../../../fixtures/manage/gateway-3.ts';

export class Gateway3AssessorPage extends SmartLookupPage {
	constructor() {
		super(
			/^\/case\/.+\/gateway-3\/gateway-3\/gateway-3-assessor-name$/,
			gateway3AssessorAnswer.inputField,
			gateway3AssessorAnswer.heading
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
export const gateway3AssessorPage = new Gateway3AssessorPage();
