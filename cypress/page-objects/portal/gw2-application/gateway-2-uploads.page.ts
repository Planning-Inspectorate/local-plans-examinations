import { gateway2UploadAnswers } from '../../../fixtures/portal/gateway-2-uploads.ts';
import { DocumentUploadPage } from '../base/document-upload-page.ts';

const gateway2UploadPath = (section: string, path: string) =>
	new RegExp(`^/manage-local-plans/[^/]+/gateway-2-submission/${section}/${path}$`);

export const gateway2CoverLetterPage = new DocumentUploadPage(
	gateway2UploadPath(gateway2UploadAnswers.coveringLetter.section, gateway2UploadAnswers.coveringLetter.path),
	gateway2UploadAnswers.coveringLetter.fieldName,
	gateway2UploadAnswers.coveringLetter.heading,
	gateway2UploadAnswers.coveringLetter.caption
);
