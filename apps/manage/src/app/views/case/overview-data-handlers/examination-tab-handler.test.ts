import { getPageLoadHandlerForPage } from './overview-page-load-handler-factory.ts';
import { ExaminationTabHandler } from './examination-tab-handler.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function dateWithAddedDays(date: Date, days: number) {
	const dateCopy = new Date(date);
	dateCopy.setDate(dateCopy.getDate() + days);
	return dateCopy;
}

describe('Test ExaminationTabHandler', () => {
	describe('test isCurrentlyPaused', () => {
		const currentDate = new Date();
		it('should return false when no pauses overlap with the current date', () => {
			const pauses = [
				{
					createdDate: currentDate,
					startDate: dateWithAddedDays(currentDate, 1),
					details: null,
					endDate: dateWithAddedDays(currentDate, 2),
					examinationInfoId: 'someId1'
				},
				{
					createdDate: currentDate,
					startDate: dateWithAddedDays(currentDate, 4),
					details: null,
					endDate: dateWithAddedDays(currentDate, 5),
					examinationInfoId: 'someId2'
				}
			];
			const isPaused = ExaminationTabHandler.isCurrentlyPaused(pauses);
			assert.equal(isPaused, false);
		});
		it('should return false when a pause starts and ends before the current date', () => {
			const pauses = [
				{
					createdDate: currentDate,
					startDate: dateWithAddedDays(currentDate, 2),
					details: null,
					endDate: dateWithAddedDays(currentDate, 2),
					examinationInfoId: 'someId1'
				},
				{
					createdDate: currentDate,
					startDate: dateWithAddedDays(currentDate, -2),
					details: null,
					endDate: dateWithAddedDays(currentDate, -1),
					examinationInfoId: 'someId2'
				}
			];
			const isPaused = ExaminationTabHandler.isCurrentlyPaused(pauses);
			assert.equal(isPaused, false);
		});
		it('should return true when an indefinite pause overlaps with the current date', () => {
			const pauses = [
				{
					createdDate: currentDate,
					startDate: dateWithAddedDays(currentDate, -1),
					details: null,
					endDate: null,
					examinationInfoId: 'someId1'
				},
				{
					createdDate: currentDate,
					startDate: dateWithAddedDays(currentDate, 4),
					details: null,
					endDate: dateWithAddedDays(currentDate, 5),
					examinationInfoId: 'someId2'
				}
			];
			const isPaused = ExaminationTabHandler.isCurrentlyPaused(pauses);
			assert.equal(isPaused, true);
		});
		it('should return true when a pause start and end date overlaps with the current date', () => {
			const pauses = [
				{
					createdDate: currentDate,
					startDate: dateWithAddedDays(currentDate, -1),
					details: null,
					endDate: dateWithAddedDays(currentDate, 2),
					examinationInfoId: 'someId1'
				},
				{
					createdDate: currentDate,
					startDate: dateWithAddedDays(currentDate, 4),
					details: null,
					endDate: dateWithAddedDays(currentDate, 5),
					examinationInfoId: 'someId2'
				}
			];
			const isPaused = ExaminationTabHandler.isCurrentlyPaused(pauses);
			assert.equal(isPaused, true);
		});
	});
});
