import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request } from 'express';
import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { createOverviewJourney, gateway1Journey, GATEWAY_1_JOURNEY_ID, OVERVIEW_JOURNEY_ID } from './journey.ts';
import { questions } from './questions.ts';

function createOverviewJourneyForTest() {
	return createOverviewJourney(
		{ baseUrl: '/case/LP-TEST-001' } as Request,
		new JourneyResponse(OVERVIEW_JOURNEY_ID, '', {}),
		questions
	);
}

function createGateway1JourneyForTest() {
	return gateway1Journey(
		{ baseUrl: '/case/LP-TEST-001' } as Request,
		new JourneyResponse(GATEWAY_1_JOURNEY_ID, '', {}),
		questions
	);
}

describe('createOverviewJourney', () => {
	it('links direct edit pages back to the case overview', () => {
		const journey = createOverviewJourneyForTest();

		const backLink = journey.getBackLink({
			params: { section: 'case-details', question: 'plan-band' }
		});

		assert.equal(backLink, '/case/LP-TEST-001/overview');
	});

	it('keeps manage list pages within the list flow', () => {
		const journey = createOverviewJourneyForTest();
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

describe('gateway1Journey', () => {
	it('links Gateway 1 question pages back to the Gateway 1 page', () => {
		const journey = createGateway1JourneyForTest();
		const gateway1Questions = [
			'notice-of-intention-publish-date',
			'estimated-gateway-1-date',
			'completed-gateway-1-date',
			'sla-sent-date',
			'sla-received-date',
			'dsa-checked'
		];

		gateway1Questions.forEach((question) => {
			const backLink = journey.getBackLink({
				params: { section: 'gateway-1', question }
			});

			assert.equal(backLink, '/case/LP-TEST-001/gateway-1');
		});
	});
});
