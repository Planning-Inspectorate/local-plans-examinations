import { AssessorConfirmPage, RemoveAssessorPage, SmartLookupPage } from '../base/index.ts';
import { gateway2AssessorAnswer } from '../../../fixtures/manage/gateway-2.ts';

export const gateway2TabPath = /^\/case\/.+\/gateway-2$/;
export const gateway2AssessorQuestionPath = new RegExp(
	`^/case/.+/gateway-2/assessor/assessors/${gateway2AssessorAnswer.path}$`
);
// each assessor has its own remove page: /remove/first for the first assessor, /remove/<id> for the others
export const gateway2AssessorRemovePath = /^\/case\/.+\/gateway-2\/assessor\/remove\/[^/]+$/;

export class Gateway2AssessorPage extends SmartLookupPage {
	constructor() {
		super(gateway2AssessorQuestionPath, gateway2AssessorAnswer.inputField, gateway2AssessorAnswer.heading);
	}

	verifyContent() {
		this.verifyLoaded();
		this.saveAndContinueButton.invoke('text').should((text) => expect(text.trim()).to.eq('Continue'));
		this.verifyBackLink(gateway2TabPath);
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

export const gateway2AssessorConfirmPage = new AssessorConfirmPage(
	/^\/case\/.+\/gateway-2\/assessor\/check$/,
	gateway2AssessorQuestionPath
);

export const gateway2RemoveAssessorPage = new RemoveAssessorPage(gateway2AssessorRemovePath, gateway2TabPath);
