import { soundUnsound } from '../../../fixtures/manage/examination.ts';
import { RadioQuestionPage } from '../base/index.ts';

export const soundUnsoundPage = new RadioQuestionPage(
	new RegExp(`^/case/.+/examination/(?:outcome|important-dates)/${soundUnsound.path}$`),
	soundUnsound.fieldName,
	soundUnsound.heading,
	[
		{ value: 'sound', text: 'Sound' },
		{ value: 'sound-with-modifications', text: 'Sound with modifications' },
		{ value: 'unsound', text: 'Unsound' }
	]
);
