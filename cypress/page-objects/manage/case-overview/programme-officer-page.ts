import { ProgrammeOfficerPage } from '../base/index.ts';
import { programmeOfficer } from '../../../fixtures/manage/overview.ts';

export const caseOverviewProgrammeOfficerPage = new ProgrammeOfficerPage(
	/^\/case\/.+\/overview\/contacts\/programme-officer$/,
	programmeOfficer.heading
);
