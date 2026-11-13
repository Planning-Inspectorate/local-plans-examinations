import { AssessorConfirmPage, RemoveAssessorPage, SmartLookupPage } from '../base/index.ts';
import { gateway3AssessorAnswer } from '../../../fixtures/manage/gateway-3.ts';

export const gateway3TabPath = /^\/case\/.+\/gateway-3$/;
export const gateway3AssessorQuestionPath = new RegExp(
	`^/case/.+/gateway-3/assessor/assessors/${gateway3AssessorAnswer.path}$`
);
// each assessor has its own remove page: /remove/first for the first assessor, /remove/<id> for the others
export const gateway3AssessorRemovePath = /^\/case\/.+\/gateway-3\/assessor\/remove\/[^/]+$/;

export class Gateway3AssessorPage extends SmartLookupPage {
	constructor() {
		super(gateway3AssessorQuestionPath, gateway3AssessorAnswer.inputField, gateway3AssessorAnswer.heading);
	}

	verifyContent() {
		this.verifyLoaded();
		this.saveAndContinueButton.invoke('text').should((text) => expect(text.trim()).to.eq('Continue'));
		this.verifyBackLink(gateway3TabPath);
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

export const gateway3AssessorConfirmPage = new AssessorConfirmPage(
	/^\/case\/.+\/gateway-3\/assessor\/check$/,
	gateway3AssessorQuestionPath
);

export const gateway3RemoveAssessorPage = new RemoveAssessorPage(gateway3AssessorRemovePath, gateway3TabPath);
