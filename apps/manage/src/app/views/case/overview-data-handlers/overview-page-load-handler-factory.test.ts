import { getPageLoadHandlerForPage } from './overview-page-load-handler-factory.ts';
import { type OverviewPageLoadHandler } from './overview-page-load-handler.ts';
import { OverviewTabHandler } from './overview-tab-handler.ts';
import { Gateway1TabHandler } from './gateway-1-tab-handler.ts';
import { Gateway2TabHandler } from './gateway-2-tab-handler.ts';
import { Gateway3TabHandler } from './gateway-3-tab-handler.ts';
import { ExaminationTabHandler } from './examination-tab-handler.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('test getPageLoadHandlerForPage', () => {
	describe('can fetch PageLoadHandler classes for all pages', () => {
		const testCases: Record<string, new () => OverviewPageLoadHandler> = {
			[COMMON_CONSTS.OVERVIEW]: OverviewTabHandler,
			[COMMON_CONSTS.GATEWAY_1_JOURNEY_ID]: Gateway1TabHandler,
			[COMMON_CONSTS.GATEWAY_2_JOURNEY_ID]: Gateway2TabHandler,
			[COMMON_CONSTS.GATEWAY_3_JOURNEY_ID]: Gateway3TabHandler,
			[COMMON_CONSTS.EXAMINATION_JOURNEY_ID]: ExaminationTabHandler
		};
		for (const page of Object.keys(testCases)) {
			const expectedHandler = testCases[page];
			it(`should fetch the correct PageLoadHandler for page '${page}'`, () => {
				const actualHandler = getPageLoadHandlerForPage(page);
				assert.equal(actualHandler, expectedHandler);
			});
		}
	});
	it('throws an exception when an unknown page is provided', () => {
		assert.throws(() => {
			getPageLoadHandlerForPage('some unknown page');
		});
	});
});
