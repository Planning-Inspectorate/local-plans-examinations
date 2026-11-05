import { ExaminationTabHandler } from './examination-tab-handler.ts';
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
					id: '1',
					createdAt: currentDate,
					planPauseDate: dateWithAddedDays(currentDate, 1),
					planPauseStartDetails: null,
					planPauseEndDate: dateWithAddedDays(currentDate, 2),
					planPauseEndDetails: null,
					examinationInfoId: 'someId1'
				},
				{
					id: '2',
					createdAt: currentDate,
					planPauseDate: dateWithAddedDays(currentDate, 4),
					planPauseStartDetails: null,
					planPauseEndDate: dateWithAddedDays(currentDate, 5),
					planPauseEndDetails: null,
					examinationInfoId: 'someId2'
				}
			];
			const isPaused = ExaminationTabHandler.isCaseCurrentlyPaused(pauses);
			assert.equal(isPaused, false);
		});
		it('should return false when a pause starts and ends before the current date', () => {
			const pauses = [
				{
					id: '1',
					createdAt: currentDate,
					planPauseDate: dateWithAddedDays(currentDate, 2),
					planPauseStartDetails: null,
					planPauseEndDate: dateWithAddedDays(currentDate, 2),
					planPauseEndDetails: null,
					examinationInfoId: 'someId1'
				},
				{
					id: '2',
					createdAt: currentDate,
					planPauseDate: dateWithAddedDays(currentDate, -2),
					planPauseStartDetails: null,
					planPauseEndDate: dateWithAddedDays(currentDate, -1),
					planPauseEndDetails: null,
					examinationInfoId: 'someId2'
				}
			];
			const isPaused = ExaminationTabHandler.isCaseCurrentlyPaused(pauses);
			assert.equal(isPaused, false);
		});
		it('should return true when an indefinite pause overlaps with the current date', () => {
			const pauses = [
				{
					id: '1',
					createdAt: currentDate,
					planPauseDate: dateWithAddedDays(currentDate, -1),
					planPauseStartDetails: null,
					planPauseEndDate: null,
					planPauseEndDetails: null,
					examinationInfoId: 'someId1'
				},
				{
					id: '2',
					createdAt: currentDate,
					planPauseDate: dateWithAddedDays(currentDate, 4),
					planPauseStartDetails: null,
					planPauseEndDate: dateWithAddedDays(currentDate, 5),
					planPauseEndDetails: null,
					examinationInfoId: 'someId2'
				}
			];
			const isPaused = ExaminationTabHandler.isCaseCurrentlyPaused(pauses);
			assert.equal(isPaused, true);
		});
		it('should return true when a pause start and end date overlaps with the current date', () => {
			const pauses = [
				{
					id: '1',
					createdAt: currentDate,
					planPauseDate: dateWithAddedDays(currentDate, -1),
					planPauseStartDetails: null,
					planPauseEndDate: dateWithAddedDays(currentDate, 2),
					planPauseEndDetails: null,
					examinationInfoId: 'someId1'
				},
				{
					id: '2',
					createdAt: currentDate,
					planPauseDate: dateWithAddedDays(currentDate, 4),
					planPauseStartDetails: null,
					planPauseEndDate: dateWithAddedDays(currentDate, 5),
					planPauseEndDetails: null,
					examinationInfoId: 'someId2'
				}
			];
			const isPaused = ExaminationTabHandler.isCaseCurrentlyPaused(pauses);
			assert.equal(isPaused, true);
		});
	});
});
