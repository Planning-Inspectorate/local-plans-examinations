import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { questions } from './questions.ts';

describe('Gateway 2 workshop question summaries', () => {
	it('formats a saved workshop date without swapping the day and month', () => {
		const question = questions['gateway2WorkshopDateAndTime-1'];
		const journey = {
			caseReference: 'PLAN-123456',
			getCurrentQuestionUrl: () => '/change',
			response: {
				answers: {
					workshops: [
						{
							createdDate: new Date('2026-01-01T00:00:00.000Z'),
							workshopDate: '7/10/2026',
							workshopTime: '09:30',
							workshopEndTime: null
						}
					]
				}
			}
		};

		const rows = question.formatAnswerForSummary('workshop', journey);

		assert.equal(rows[0].value, '7 October 2026');
		assert.equal(rows[1].value, '09:30');
		assert.equal(rows.length, 2);
	});
});
