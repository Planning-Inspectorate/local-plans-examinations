import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { questions } from './questions.ts';
import { validationResult } from 'express-validator';

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

describe('Examination hearing questions', () => {
	async function validate(key: string, body: Record<string, unknown>) {
		const question = questions[key];
		const req = { body };
		for (const validator of question.validators) {
			const chains = [validator.validate(question)].flat();
			for (const chain of chains) await chain.run(req);
		}
		return validationResult(req).mapped();
	}

	it('uses hearing-specific labels and buttons without changing other questions', () => {
		assert.equal(questions['examinationHearingLocationType-1'].title, 'Is the hearing in-person, hybrid or remote?');
		assert.equal(questions['examinationHearingLocationKnown-1'].title, 'Do you know the venue address?');
		assert.equal(questions['examinationHearingVenueAddress-1'].title, 'Venue address');
		assert.equal(questions['examinationHearingRemoteMeetingLinkKnown-1'].title, 'Do you have a remote meeting link?');
		assert.equal(questions['examinationHearingRemoteMeetingLink-1'].title, 'Remote meeting link');
		assert.equal(questions['examinationHearingDateAndTime-1'].continueButtonText, 'Continue');
		assert.equal(questions['examinationHearingExpectedDays-2'].continueButtonText, 'Continue');
		assert.equal(questions.qaDate.continueButtonText, 'Save and continue');
	});

	for (const [hour, minute, valid] of [
		['00', '00', true],
		['23', '59', true],
		['9', '5', true],
		['24', '00', false],
		['25', '70', false],
		['12', '60', false],
		['-1', '30', false],
		['1.5', '30', false],
		['abc', '30', false],
		['', '', false],
		[undefined, '30', false],
		['12', undefined, false],
		['', '30', false],
		['12', '', false]
	] as const) {
		it(`${valid ? 'accepts' : 'rejects'} the hearing time ${hour}:${minute}`, async () => {
			const errors = await validate('examinationHearingDateAndTime-2', {
				'hearingDate-2_day': '7',
				'hearingDate-2_month': '11',
				'hearingDate-2_year': '2026',
				'hearingTime-2_hour': hour,
				'hearingTime-2_minute': minute
			});
			assert.deepEqual(Object.keys(errors), valid ? [] : ['hearingTime-2_hour']);
			if (!valid) assert.equal(errors['hearingTime-2_hour'].msg, 'Enter a valid time');
		});
	}

	for (const [answer, days, valid] of [
		['yes', '3', true],
		['yes', '', false],
		['yes', '   ', false],
		['no', '', true],
		['', '', false]
	] as const) {
		it(`${valid ? 'accepts' : 'rejects'} expected days ${JSON.stringify({ answer, days })}`, async () => {
			const errors = await validate('examinationHearingExpectedDays-2', {
				'hearingExpectedDaysKnown-2': answer,
				'hearingExpectedDaysKnown-2_hearingExpectedDays': days
			});
			assert.equal(Object.keys(errors).length === 0, valid);
			if (answer === 'yes' && !valid) {
				assert.equal(errors['hearingExpectedDaysKnown-2'].msg, 'Enter the expected number of days');
			}
		});
	}

	it('formats hearing date, time and expected-days summary labels', () => {
		const journey = {
			getCurrentQuestionUrl: () => '/change',
			response: {
				answers: {
					hearings: [
						{
							createdDate: new Date('2026-01-01'),
							hearingDate: '7/11/2026',
							hearingTime: '10:30',
							hearingExpectedDaysKnown: 'yes',
							hearingExpectedDays: '3'
						}
					]
				}
			}
		};
		const dateRows = questions['examinationHearingDateAndTime-1'].formatAnswerForSummary('hearing', journey);
		assert.deepEqual(
			dateRows.map(({ key, value }) => ({ key, value })),
			[
				{ key: 'Hearing date', value: '7 November 2026' },
				{ key: 'Hearing time', value: '10:30' }
			]
		);
		const daysRows = questions['examinationHearingExpectedDays-1'].formatAnswerForSummary('hearing', journey);
		assert.equal(daysRows[0].key, 'Do you know the expected number of days?');
	});
});
