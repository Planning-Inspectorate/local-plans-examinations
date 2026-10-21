import { examinationPage } from '../../page-objects/manage/examination/index.ts';
import { openManageCase, openSeededManageCase, type SeededManageCase } from './seeded-case-flow.ts';
import type { SeedCyOptions } from '../../../packages/database/src/seed/seed-cy.ts';

export const openExaminationPage = (seededManageCase: SeededManageCase) => {
	return openManageCase(seededManageCase).then(({ planTitle }) => {
		examinationPage.openServiceNavigationItem('Examination');
		examinationPage.verifyLoaded(planTitle);
	});
};

export const openSeededExaminationPage = (options?: SeedCyOptions) => {
	return openSeededManageCase(options).then(({ planTitle }) => {
		examinationPage.openServiceNavigationItem('Examination');
		examinationPage.verifyLoaded(planTitle);
	});
};
