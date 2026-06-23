import { keyStageDatesPage } from '../../../../page-objects/manage/create-case/index.ts';

describe('Create a case - key stage dates page', () => {
	it('loads with all expected date fields', { tags: ['regression'] }, () => {
		keyStageDatesPage.visit();
		keyStageDatesPage.verifyLoaded();
	});
});
