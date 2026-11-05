import { examinationSubmissionWebsite } from '../../../fixtures/portal/examination-website.ts';
import { SingleLineInputPage } from '../base/single-line-input-page.ts';

export const examinationSubmissionWebsitePage = new SingleLineInputPage(
	new RegExp(
		`^/manage-local-plans/[^/]+/examination/${examinationSubmissionWebsite.section}/${examinationSubmissionWebsite.path}$`
	),
	examinationSubmissionWebsite.fieldName,
	examinationSubmissionWebsite.heading,
	examinationSubmissionWebsite.addCy,
	examinationSubmissionWebsite.value
);
