import { examinationPage } from '../../page-objects/manage/examination/index.ts';
import { openManageCase, openSeededManageCase, type SeededManageCase } from './seeded-case-flow.ts';

export const openExaminationPage = (seededManageCase: SeededManageCase) => {
	return openManageCase(seededManageCase).then(({ planTitle }) => {
		examinationPage.openServiceNavigationItem('Examination');
		examinationPage.verifyLoaded(planTitle);
	});
};

export const openSeededExaminationPage = () => {
	return openSeededManageCase().then(({ planTitle }) => {
		examinationPage.openServiceNavigationItem('Examination');
		examinationPage.verifyLoaded(planTitle);
	});
};
