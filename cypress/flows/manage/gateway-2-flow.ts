import { gateway2Page } from '../../page-objects/manage/gateway-2/index.ts';
import { openSeededManageCase } from './seeded-case-flow.ts';

export const openSeededGateway2Page = () => {
	return openSeededManageCase().then(({ planTitle }) => {
		gateway2Page.openServiceNavigationItem('Gateway 2');
		gateway2Page.verifyLoaded(planTitle);
	});
};
