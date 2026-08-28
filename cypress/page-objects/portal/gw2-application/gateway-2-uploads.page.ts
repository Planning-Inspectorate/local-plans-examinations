import { gateway2UploadAnswers } from '../../../fixtures/portal/gateway-2-uploads.ts';
import { DocumentUploadPage } from '../base/document-upload-page.ts';

const gateway2UploadPath = (section: string, path: string) =>
	new RegExp(`^/manage-local-plans/[^/]+/gateway-2-submission/${section}/${path}$`);

export const gateway2CoverLetterPage = new DocumentUploadPage(
	gateway2UploadPath(gateway2UploadAnswers.coveringLetter.section, gateway2UploadAnswers.coveringLetter.path),
	gateway2UploadAnswers.coveringLetter.fieldName,
	gateway2UploadAnswers.coveringLetter.heading,
	gateway2UploadAnswers.coveringLetter.caption,
	gateway2UploadAnswers.coveringLetter.addCy,
	gateway2UploadAnswers.coveringLetter.section,
	gateway2UploadAnswers.coveringLetter.path
);

export const localPlanTimetablePage = new DocumentUploadPage(
	gateway2UploadPath(gateway2UploadAnswers.localPlanTimetable.section, gateway2UploadAnswers.localPlanTimetable.path),
	gateway2UploadAnswers.localPlanTimetable.fieldName,
	gateway2UploadAnswers.localPlanTimetable.heading,
	gateway2UploadAnswers.localPlanTimetable.caption,
	gateway2UploadAnswers.localPlanTimetable.addCy,
	gateway2UploadAnswers.localPlanTimetable.section,
	gateway2UploadAnswers.localPlanTimetable.path
);

export const noticeOfIntentionToCommenceLocalPlanPage = new DocumentUploadPage(
	gateway2UploadPath(
		gateway2UploadAnswers.noticeOfIntentionToCommenceLocalPlan.section,
		gateway2UploadAnswers.noticeOfIntentionToCommenceLocalPlan.path
	),
	gateway2UploadAnswers.noticeOfIntentionToCommenceLocalPlan.fieldName,
	gateway2UploadAnswers.noticeOfIntentionToCommenceLocalPlan.heading,
	gateway2UploadAnswers.noticeOfIntentionToCommenceLocalPlan.caption,
	gateway2UploadAnswers.noticeOfIntentionToCommenceLocalPlan.addCy,
	gateway2UploadAnswers.noticeOfIntentionToCommenceLocalPlan.section,
	gateway2UploadAnswers.noticeOfIntentionToCommenceLocalPlan.path
);

export const subsequentWorkTowardsDraftPlanPage = new DocumentUploadPage(
	gateway2UploadPath(
		gateway2UploadAnswers.subsequentWorkTowardsDraftPlan.section,
		gateway2UploadAnswers.subsequentWorkTowardsDraftPlan.path
	),
	gateway2UploadAnswers.subsequentWorkTowardsDraftPlan.fieldName,
	gateway2UploadAnswers.subsequentWorkTowardsDraftPlan.heading,
	gateway2UploadAnswers.subsequentWorkTowardsDraftPlan.caption,
	gateway2UploadAnswers.subsequentWorkTowardsDraftPlan.addCy,
	gateway2UploadAnswers.subsequentWorkTowardsDraftPlan.section,
	gateway2UploadAnswers.subsequentWorkTowardsDraftPlan.path
);
