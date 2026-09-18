import { getJourneyDataLoadHandlerForPage } from './journey-data-load-handler-factory.ts';
import { type JourneyDataLoadHandler } from './journey-data-load-handler.ts';
import { OverviewDataLoadHandler } from './overview-data-load-handler.ts';
import { Gateway1DataLoadHandler } from './gateway-1-data-load-handler.ts';
import { Gateway2DataLoadHandler } from './gateway-2-data-load-handler.ts';
import { Gateway3DataLoadHandler } from './gateway-3-data-load-handler.ts';
import { ExaminationDataLoadHandler } from './examination-data-load-handler.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('test getJourneyDataLoadHandlerForPage', () => {
	describe('can fetch JourneyDataLoadHandler classes for all pages', () => {
		const testCases: Record<string, new () => JourneyDataLoadHandler> = {
			[COMMON_CONSTS.OVERVIEW]: OverviewDataLoadHandler,
			[COMMON_CONSTS.GATEWAY_1_JOURNEY_ID]: Gateway1DataLoadHandler,
			[COMMON_CONSTS.GATEWAY_2_JOURNEY_ID]: Gateway2DataLoadHandler,
			[COMMON_CONSTS.GATEWAY_3_JOURNEY_ID]: Gateway3DataLoadHandler,
			[COMMON_CONSTS.EXAMINATION_JOURNEY_ID]: ExaminationDataLoadHandler
		};
		for (const page of Object.keys(testCases)) {
			const expectedHandler = testCases[page];
			it(`should fetch the correct JourneyDataLoadHandler for page '${page}'`, () => {
				const actualHandler = getJourneyDataLoadHandlerForPage(page);
				assert.equal(actualHandler, expectedHandler);
			});
		}
	});
	it('throws an exception when an unknown page is provided', () => {
		assert.throws(() => {
			getJourneyDataLoadHandlerForPage('some unknown page');
		});
	});
});
