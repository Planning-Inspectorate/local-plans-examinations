import { examinationWebsite } from '../../../fixtures/manage/examination.ts';
import { SingleLineInputPage } from '../base/index.ts';

export const examinationWebsitePage = new SingleLineInputPage(
	new RegExp(`^/case/.+/examination/examination/${examinationWebsite.path}$`),
	examinationWebsite.fieldName,
	examinationWebsite.heading
);
