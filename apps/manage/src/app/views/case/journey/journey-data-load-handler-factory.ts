import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { type JourneyDataLoadHandler } from './journey-data-load-handler.ts';
import { OverviewDataLoadHandler } from './overview-data-load-handler.ts';
import { Gateway1DataLoadHandler } from './gateway-1-data-load-handler.ts';
import { Gateway2DataLoadHandler } from './gateway-2-data-load-handler.ts';
import { Gateway3DataLoadHandler } from './gateway-3-data-load-handler.ts';
import { ExaminationDataLoadHandler } from './examination-data-load-handler.ts';

const OPTIONS: Record<string, new () => JourneyDataLoadHandler> = {
	[COMMON_CONSTS.OVERVIEW]: OverviewDataLoadHandler,
	[COMMON_CONSTS.GATEWAY_1_JOURNEY_ID]: Gateway1DataLoadHandler,
	[COMMON_CONSTS.GATEWAY_2_JOURNEY_ID]: Gateway2DataLoadHandler,
	[COMMON_CONSTS.GATEWAY_3_JOURNEY_ID]: Gateway3DataLoadHandler,
	[COMMON_CONSTS.EXAMINATION_JOURNEY_ID]: ExaminationDataLoadHandler
};

export function getJourneyDataLoadHandlerForPage(page: string) {
	if (page in OPTIONS) {
		return OPTIONS[page];
	}
	throw Error(
		`Could not find a JourneyDataLoadHandler class for the page '${page}' in journey-data-load-handler-factory.ts::OPTIONS`
	);
}
