import { examinationPage } from '../../page-objects/manage/examination/index.ts';
import { openSeededManageCase } from './seeded-case-flow.ts';

export const openSeededExaminationPage = () => {
	return openSeededManageCase().then(({ planTitle }) => {
		examinationPage.openServiceNavigationItem('Examination');
		examinationPage.verifyLoaded(planTitle);
	});
};
