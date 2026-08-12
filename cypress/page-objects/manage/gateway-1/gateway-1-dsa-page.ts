import { gateway1DsaAnswer } from '../../../fixtures/manage/gateway-1.ts';
import { RadioQuestionPage } from '../base/index.ts';

export const gateway1DsaPage = new RadioQuestionPage(
	/^\/case\/.+\/gateway-1\/gateway-1\/dsa-checked$/,
	'dsaChecked',
	'Does the LPA have a Digital Sharing Agreement (DSA)?',
	[
		{ value: gateway1DsaAnswer.value, text: gateway1DsaAnswer.display },
		{ value: gateway1DsaAnswer.updatedValue, text: gateway1DsaAnswer.updatedDisplay }
	]
);
