import { checkYourAnswersPage } from '../../../../page-objects/manage/create-case/index.ts';

describe('Create a case - check your answers page', () => {
	it('loads the check your answers page before the journey is complete', { tags: ['regression'] }, () => {
		checkYourAnswersPage.visit();
		checkYourAnswersPage.verifyLoaded();
		checkYourAnswersPage.verifyCannotSubmitYet();
	});
});
