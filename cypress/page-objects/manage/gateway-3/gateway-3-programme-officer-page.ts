import { ProgrammeOfficerPage } from '../base/index.ts';
import { gateway3ProgrammeOfficerAnswer } from '../../../fixtures/manage/gateway-3.ts';

export const gateway3ProgrammeOfficerPage = new ProgrammeOfficerPage(
	/^\/case\/.+\/gateway-3\/gateway-3\/programme-officer$/,
	gateway3ProgrammeOfficerAnswer.heading
);
