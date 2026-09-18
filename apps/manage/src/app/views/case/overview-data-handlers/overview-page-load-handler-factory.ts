import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { type OverviewPageLoadHandler } from './overview-page-load-handler.ts';
import { OverviewTabHandler } from './overview-tab-handler.ts';
import { Gateway1TabHandler } from './gateway-1-tab-handler.ts';
import { Gateway2TabHandler } from './gateway-2-tab-handler.ts';
import { Gateway3TabHandler } from './gateway-3-tab-handler.ts';
import { ExaminationTabHandler } from './examination-tab-handler.ts';

const OPTIONS: Record<string, new () => OverviewPageLoadHandler> = {
	[COMMON_CONSTS.OVERVIEW]: OverviewTabHandler,
	[COMMON_CONSTS.GATEWAY_1_JOURNEY_ID]: Gateway1TabHandler,
	[COMMON_CONSTS.GATEWAY_2_JOURNEY_ID]: Gateway2TabHandler,
	[COMMON_CONSTS.GATEWAY_3_JOURNEY_ID]: Gateway3TabHandler,
	[COMMON_CONSTS.EXAMINATION_JOURNEY_ID]: ExaminationTabHandler
};

export function getPageLoadHandlerForPage(page: string) {
	if (page in OPTIONS) {
		return OPTIONS[page];
	}
	throw Error(
		`Could not find a PageLoadHandler class for the page '${page}' in overview-page-load-handler-factory.ts::OPTIONS`
	);
}
