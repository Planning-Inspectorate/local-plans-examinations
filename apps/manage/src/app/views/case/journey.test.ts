import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request } from 'express';
import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { createOverviewJourney, JOURNEY_ID } from './journey.ts';
import { questions } from './questions.ts';

function createJourney() {
	return createOverviewJourney(
		{ baseUrl: '/case/LP-TEST-001' } as Request,
		new JourneyResponse(JOURNEY_ID, '', {}),
		questions
	);
}

describe('createOverviewJourney', () => {
	it('links direct edit pages back to the case overview', () => {
		const journey = createJourney();

		const backLink = journey.getBackLink({
			params: { section: 'case-details', question: 'plan-band' }
		});

		assert.equal(backLink, '/case/LP-TEST-001/overview');
	});

	it('keeps manage list pages within the list flow', () => {
		const journey = createJourney();
		const manageListQuestion = journey.sections[1].questions[0];

		const backLink = journey.getBackLink({
			params: {
				section: 'contacts',
				question: 'check-contact-details',
				manageListAction: 'add',
				manageListQuestion: 'contact-details'
			},
			manageListQuestion
		});

		assert.equal(backLink, '/case/LP-TEST-001/overview/contacts/check-contact-details');
	});
});
