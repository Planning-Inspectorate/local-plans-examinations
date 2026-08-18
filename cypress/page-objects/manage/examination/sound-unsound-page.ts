import { soundUnsound } from '../../../fixtures/manage/examination.ts';
import { RadioQuestionPage } from '../base/index.ts';

export const soundUnsoundPage = new RadioQuestionPage(
	new RegExp(`^/case/.+/examination/important-dates/${soundUnsound.path}$`),
	soundUnsound.fieldName,
	soundUnsound.heading,
	[
		{ value: 'yes', text: 'Sound' },
		{ value: 'no', text: 'Unsound' }
	]
);
