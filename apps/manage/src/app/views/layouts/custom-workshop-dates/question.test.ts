import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import CustomWorkshopDatesQuestion from './question.ts';

const baseParams = {
	title: 'Workshop dates',
	fieldName: 'workshops',
	question: 'Workshop dates',
	url: 'gateway-2-workshop-dates',
	journeyId: 'timetable'
};

const buildQuestion = () => new CustomWorkshopDatesQuestion(baseParams);

const buildJourney = (baseUrl = '/case/ABC123/timetable') => ({
	makeBaseUrl: () => baseUrl
});

describe('CustomWorkshopDatesQuestion', () => {
	it('should list all workshop dates and link to the Gateway 2 tab', () => {
		const question = buildQuestion();
		const workshops = [
			{ workshopDate: new Date('2026-02-05T12:00:00.000Z') },
			{ workshopDate: new Date('2026-03-17T12:00:00.000Z') }
		];

		const summary = question.formatAnswerForSummary('gateway-2', buildJourney(), workshops);

		assert.deepEqual(summary, [
			{
				key: 'Workshop dates',
				value: '5 February 2026<br>17 March 2026',
				action: {
					href: '/case/ABC123/gateway-2',
					text: 'View',
					visuallyHiddenText: 'Workshop dates'
				}
			}
		]);
	});

	it('should show the not-started text when there are no workshop dates', () => {
		const question = buildQuestion();

		const summary = question.formatAnswerForSummary('gateway-2', buildJourney(), [{ workshopDate: null }, {}]);

		assert.equal(summary[0].value, question.notStartedText);
		assert.deepEqual(summary[0].action, {
			href: '/case/ABC123/gateway-2',
			text: 'View',
			visuallyHiddenText: 'Workshop dates'
		});
	});

	it('should handle a non-array answer as no workshop dates', () => {
		const question = buildQuestion();

		const summary = question.formatAnswerForSummary('gateway-2', buildJourney(), undefined);

		assert.equal(summary[0].value, question.notStartedText);
	});
});
