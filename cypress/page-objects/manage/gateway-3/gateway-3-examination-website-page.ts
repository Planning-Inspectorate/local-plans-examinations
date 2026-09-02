import { gateway3ExaminationWebsite } from '../../../fixtures/manage/gateway-3.ts';
import { SingleLineInputPage } from '../base/index.ts';

export const gateway3ExaminationWebsitePage = new SingleLineInputPage(
	new RegExp(`^/case/.+/gateway-3/gateway-3/${gateway3ExaminationWebsite.path}$`),
	gateway3ExaminationWebsite.fieldName,
	gateway3ExaminationWebsite.heading
);
