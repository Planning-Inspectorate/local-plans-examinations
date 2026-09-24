import { gateway3Page } from '../../page-objects/manage/gateway-3/index.ts';
import { openSeededManageCase } from './seeded-case-flow.ts';

export const openSeededGateway3Page = () => {
	return openSeededManageCase().then(({ planTitle }) => {
		gateway3Page.openServiceNavigationItem('Gateway 3');
		gateway3Page.verifyLoaded(planTitle);
	});
};
