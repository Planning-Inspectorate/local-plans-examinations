import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { questions } from './questions.ts';

describe('Gateway 2 workshop question summaries', () => {
	function formatWorkshopDate(workshopDate: string, workshopEndTime: string | null = null) {
		const question = questions['gateway2WorkshopDateAndTime-1'];
		const journey = {
			caseReference: 'PLAN-123456',
			getCurrentQuestionUrl: () => '/change',
			response: {
				answers: {
					workshops: [
						{
							createdDate: new Date('2026-01-01T00:00:00.000Z'),
							workshopDate,
							workshopTime: '09:30',
							workshopEndTime
						}
					]
				}
			}
		};

		const rows = question.formatAnswerForSummary('workshop', journey);
		return rows;
	}

	it('formats a saved workshop date without swapping the day and month', () => {
		const rows = formatWorkshopDate('7/10/2026');

		assert.equal(rows[0].value, '7 October 2026');
		assert.equal(rows[1].key, 'Workshop start time');
		assert.equal(rows[1].value, '09:30');
		assert.equal(rows.length, 2);
	});

	it('labels the optional end time separately from the start time', () => {
		const rows = formatWorkshopDate('7/10/2026', '16:00');

		assert.equal(rows[1].key, 'Workshop start time');
		assert.equal(rows[2].key, 'Workshop end time');
		assert.equal(rows[2].value, '16:00');
	});

	it('formats a workshop date loaded from the database', () => {
		const rows = formatWorkshopDate('2026-12-12T00:00:00.000Z');

		assert.equal(rows[0].value, '12 December 2026');
	});
});
