import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import CustomHearingDatesQuestion from './question.ts';

const baseParams = {
	title: 'Hearing dates',
	fieldName: 'hearings',
	question: 'Hearing dates',
	url: 'examination-hearing-dates',
	journeyId: 'timetable'
};

const buildQuestion = () => new CustomHearingDatesQuestion(baseParams);

const buildJourney = (baseUrl = '/case/ABC123/timetable') => ({
	makeBaseUrl: () => baseUrl
});

describe('CustomHearingDatesQuestion', () => {
	it('should list all hearing dates and link to the Examination tab', () => {
		const question = buildQuestion();
		const hearings = [
			{ hearingDate: new Date('2026-02-05T12:00:00.000Z') },
			{ hearingDate: new Date('2026-03-17T12:00:00.000Z') }
		];

		const summary = question.formatAnswerForSummary('gateway-2', buildJourney(), hearings);

		assert.deepEqual(summary, [
			{
				key: 'Hearing dates',
				value: '5 February 2026<br>17 March 2026',
				action: {
					href: '/case/ABC123/examination',
					text: 'View',
					visuallyHiddenText: 'Hearing dates'
				}
			}
		]);
	});

	it('should show the not-started text when there are no hearing dates', () => {
		const question = buildQuestion();

		const summary = question.formatAnswerForSummary('examination', buildJourney(), [{ hearingDate: null }, {}]);

		assert.equal(summary[0].value, question.notStartedText);
		assert.deepEqual(summary[0].action, {
			href: '/case/ABC123/examination',
			text: 'View',
			visuallyHiddenText: 'Hearing dates'
		});
	});

	it('should handle a non-array answer as no hearing dates', () => {
		const question = buildQuestion();

		const summary = question.formatAnswerForSummary('examination', buildJourney(), undefined);

		assert.equal(summary[0].value, question.notStartedText);
	});
});
