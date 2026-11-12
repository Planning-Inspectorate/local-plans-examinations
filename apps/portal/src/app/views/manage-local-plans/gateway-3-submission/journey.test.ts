import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { createGateway3Questions } from './questions.ts';

function buildQuestions() {
	return createGateway3Questions(undefined);
}

describe('createJourney (Gateway 3)', () => {
	it('builds scoped Gateway 3 submission URLs from a plan reference', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: {
				planReference: 'PLAN-123456'
			}
		} as unknown as Request;

		const journey = createJourney(req, response, buildQuestions());

		assert.strictEqual(journey.baseUrl, '/manage-local-plans/PLAN-123456/gateway-3-submission');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plans/PLAN-123456/gateway-3-submission');
		assert.strictEqual(
			journey.taskListTemplate,
			'views/manage-local-plans/gateway-3-submission/check-your-answers.njk'
		);
	});

	it('builds session Gateway 3 submission URLs without a plan reference', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'session', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: {}
		} as unknown as Request;

		const journey = createJourney(req, response, buildQuestions());

		assert.strictEqual(journey.baseUrl, '/manage-local-plans/gateway-3-submission');
		assert.strictEqual(journey.taskListUrl, '/manage-local-plans/gateway-3-submission');
		assert.strictEqual(journey.initialBackLink, '/');
	});

	it('creates the procedural documents section in the required order', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: { planReference: 'PLAN-001' }
		} as unknown as Request;

		const journey = createJourney(req, response, buildQuestions());

		assert.strictEqual(journey.sections[0].name, 'Procedural documents');
		assert.strictEqual(journey.sections[0].segment, 'procedural-documents');
		assert.deepStrictEqual(
			journey.sections[0].questions.map((question) => question.fieldName),
			[
				'statementOfCompliance',
				'statementOfSoundness',
				'gateway2IssuesSummary',
				'changesSinceConsultationStatement',
				'consultationProposedPlanSummary'
			]
		);
	});

	it('creates the consultation documents section in the required order', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: { planReference: 'PLAN-001' }
		} as unknown as Request;

		const journey = createJourney(req, response, buildQuestions());

		assert.strictEqual(journey.sections.length, 3);
		assert.strictEqual(journey.sections[1].name, 'Consultation documents');
		assert.strictEqual(journey.sections[1].segment, 'consultation-documents');
		assert.deepStrictEqual(
			journey.sections[1].questions.map((question) => question.fieldName),
			[
				'representationsProgressSummary',
				'copiesOfRepresentations',
				'consultationEngagementSummary',
				'scopingConsultationSummary',
				'consultationContentEvidenceSummary'
			]
		);
	});

	it('creates the plan content, evidence and background section in the required order', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: { planReference: 'PLAN-001' }
		} as unknown as Request;

		const journey = createJourney(req, response, buildQuestions());

		assert.strictEqual(journey.sections[2].name, 'Plan content, evidence and background');
		assert.strictEqual(journey.sections[2].segment, 'plan-content-evidence-and-background');
		assert.deepStrictEqual(
			journey.sections[2].questions.map((question) => question.fieldName),
			[
				'proposedLocalPlan',
				'examinationWebsite',
				'practicalArrangementsStatement',
				'environmentalReport',
				'statementOfReasonsDetermination',
				'otherDocuments',
				'mapOfPolicies',
				'supplementaryPlansStatement'
			]
		);
	});

	it('uses the examination website caption in its rendered view model', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: { planReference: 'PLAN-001' }
		} as unknown as Request;

		const journey = createJourney(req, response, buildQuestions());
		const section = journey.sections[2];
		const question = section.questions.find(({ fieldName }) => fieldName === 'examinationWebsite');

		assert.ok(question);
		const viewModel = question.toViewModel({ params: {} as any, section, journey });
		assert.strictEqual(viewModel.pageCaption, 'Plan content and evidence documents');
	});

	it('overrides back link to the overview URL for non-manage-list pages', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: { planReference: 'PLAN-001' }
		} as unknown as Request;

		const journey = createJourney(req, response, buildQuestions());
		const backLink = journey.getBackLink({ params: {} as any });

		assert.strictEqual(backLink, '/manage-local-plans/PLAN-001/gateway-3-submission');
	});
});
