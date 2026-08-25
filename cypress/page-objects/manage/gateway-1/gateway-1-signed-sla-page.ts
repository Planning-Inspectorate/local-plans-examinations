import { signedSLA } from '../../../fixtures/manage/gateway-1.ts';
import { DocumentUploadPage } from '../base/index.ts';

const gateway1QuestionPath = (path: string) => new RegExp(`^/case/.+/gateway-1/gateway-1/${path}$`);

export const gateway1SignedSLAPage = new DocumentUploadPage(
	gateway1QuestionPath(signedSLA.path),
	signedSLA.field,
	signedSLA.heading,
	signedSLA.caption
);
