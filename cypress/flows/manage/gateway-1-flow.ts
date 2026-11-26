import { gateway1Page } from '../../page-objects/manage/gateway-1/index.ts';
import { openSeededManageCase } from './seeded-case-flow.ts';

export const openSeededGateway1Page = () => {
	return openSeededManageCase().then((seededCase) => {
		gateway1Page.openServiceNavigationItem('Gateway 1');
		gateway1Page.verifyLoaded(seededCase.planTitle);
		return cy.wrap(seededCase, { log: false });
	});
};
