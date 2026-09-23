import { examinationWebsite } from '../../../fixtures/portal/examination.ts';
import { SingleLineInputPage } from '../base/single-line-input-page.ts';

export const examinationWebsitePage = new SingleLineInputPage(
	new RegExp(
		`^/manage-local-plans/[^/]+/gateway-3-submission/${examinationWebsite.section}/${examinationWebsite.path}$`
	),
	examinationWebsite.fieldName,
	examinationWebsite.heading,
	examinationWebsite.addCy
);
