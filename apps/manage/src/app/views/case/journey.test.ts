import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request } from 'express';
import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import {
	createOverviewJourney,
	createGateway1Journey,
	createGateway2Journey,
	createGateway3Journey,
	createExaminationJourney,
	GATEWAY_1_JOURNEY_ID,
	GATEWAY_2_JOURNEY_ID,
	OVERVIEW_JOURNEY_ID,
	GATEWAY_3_JOURNEY_ID,
	EXAMINATION_JOURNEY_ID
} from './journey.ts';
import { questions } from './questions.ts';

function createOverviewJourneyForTest() {
	return createOverviewJourney(
		{ baseUrl: '/case/LP-TEST-001' } as Request,
		new JourneyResponse(OVERVIEW_JOURNEY_ID, '', {}),
		questions
	);
}

function createGateway1JourneyForTest() {
	return createGateway1Journey(
		{ baseUrl: '/case/LP-TEST-001' } as Request,
		new JourneyResponse(GATEWAY_1_JOURNEY_ID, '', {}),
		questions
	);
}

function createGateway2JourneyForTest() {
	return createGateway2Journey(
		{ baseUrl: '/case/LP-TEST-001' } as Request,
		new JourneyResponse(GATEWAY_2_JOURNEY_ID, '', {}),
		questions
	);
}

function createGateway3JourneyForTest() {
	return createGateway3Journey(
		{ baseUrl: '/case/LP-TEST-001' } as Request,
		new JourneyResponse(GATEWAY_3_JOURNEY_ID, '', {}),
		questions
	);
}

function createExaminationJourneyForTest() {
	return createExaminationJourney(
		{ baseUrl: '/case/LP-TEST-001' } as Request,
		new JourneyResponse(EXAMINATION_JOURNEY_ID, '', {}),
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
			'expected-gateway-1-date',
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

describe('gateway2Journey', () => {
	it('links Gateway 2 question pages back to the Gateway 1 page', () => {
		const journey = createGateway2JourneyForTest();
		const gateway2Questions = [
			'gateway-2-expected-date',
			'gateway-2-actual-date',
			'gateway-2-valid-date',
			'gateway-2-assessor',
			'gateway-2-assessor-appointed',
			'gateway-2-workshop-date',
			'gateway-2-workshop-venue'
		];

		gateway2Questions.forEach((question) => {
			const backLink = journey.getBackLink({
				params: { section: 'gateway-2', question }
			});

			assert.equal(backLink, '/case/LP-TEST-001/gateway-2');
		});
	});
});

describe('gateway3Journey', () => {
	it('links Gateway 3 question pages back to the Gateway 3 page', () => {
		const journey = createGateway3JourneyForTest();
		const gateway3Questions = [
			'gateway-3-expected-date',
			'gateway-3-actual-date',
			'cgateway-3-assessor-name',
			'gateway-3-assessor-date-of-appointment',
			'programme-officer-details',
			'gateway-3-completion-date'
		];

		gateway3Questions.forEach((question) => {
			const backLink = journey.getBackLink({
				params: { section: 'gateway-3', question }
			});

			assert.equal(backLink, '/case/LP-TEST-001/gateway-3');
		});
	});
});

describe('createExaminationJourney', () => {
	it('links Examination question pages back to the Gateway 3 page', () => {
		const journey = createExaminationJourneyForTest();
		const gateway2Questions = [
			'examination-expected-submission-date',
			'examination-actual-submission-date',
			'examining-inspector-1',
			'examining-inspector-2',
			'examining-inspector-3',
			'examination-examining-inspector-appointment-date',
			'letter-sent-to-mhclg-date',
			'letter-issue-date',
			'qa-date',
			'qa-inspector-1',
			'qa-inspector-2',
			'qa-inspector-3',
			'report-sent-to-panel-date',
			'panel-response-to-inspector-date',
			'fact-check-date-received-from-inspector',
			'fact-check-due-date',
			'fact-check-actual-date',
			'fact-check-received-back-from-lpa-date',
			'final-report-issue-date',
			'plan-pause-start-date',
			'plan-pause-end-date',
			'withdrawn-date',
			'is-sound',
			'sound-unsound-date',
			'adoption-date',
			'approved-for-cil-date'
		];

		gateway2Questions.forEach((question) => {
			const backLink = journey.getBackLink({
				params: { section: 'examination', question }
			});

			assert.equal(backLink, '/case/LP-TEST-001/examination');
		});
	});
});
