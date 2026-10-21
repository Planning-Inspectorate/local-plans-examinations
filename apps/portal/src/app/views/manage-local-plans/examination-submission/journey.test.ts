import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { createExaminationQuestions } from './questions.ts';

describe('createJourney (examination submission)', () => {
	it('builds a case-scoped journey with all examination items in acceptance-criteria order', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: { planReference: 'PLAN-61797' }
		} as unknown as Request;

		const journey = createJourney(req, response, createExaminationQuestions('PLAN-61797'));

		assert.equal(journey.baseUrl, '/manage-local-plans/PLAN-61797/examination-submission');
		assert.equal(journey.taskListUrl, '/manage-local-plans/PLAN-61797/examination-submission');
		assert.equal(journey.sections.length, 1);
		assert.equal(journey.sections[0].name, 'Examination details');
		assert.deepEqual(
			journey.sections[0].questions.map((question) => question.title),
			[
				'Examination website',
				'Local plan submission for examination',
				'Map of proposed local plan policies',
				'Gateway 3 completion statement',
				'Summary of consultation and engagement activities in preparing the proposed local plan',
				'Summary of consultation on proposed local plan',
				'Representations on conformity with an operative spatial development strategy',
				'Statement of compliance',
				'Statement of soundness',
				'Environmental report',
				'Statement demonstrating that the proposed local plan is unlikely to have significant environmental effects',
				'Additional evidence documents',
				'Statement explaining changes made since Gateway 3 assessment and details of any additional consultations',
				'Representations required in the Gateway 3 report'
			]
		);
	});

	it('returns directly to the examination submission page from item pages', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: { planReference: 'PLAN-61797' }
		} as unknown as Request;
		const journey = createJourney(req, response, createExaminationQuestions('PLAN-61797'));

		assert.equal(journey.getBackLink({ params: {} as never }), '/manage-local-plans/PLAN-61797/examination-submission');
	});

	it('uses the standard journey backlink for manage-list steps', () => {
		const response = new JourneyResponse(JOURNEY_ID, 'case-id', {});
		const req = {
			baseUrl: '/manage-local-plans',
			params: { planReference: 'PLAN-61797' }
		} as unknown as Request;
		const journey = createJourney(req, response, createExaminationQuestions('PLAN-61797'));

		assert.equal(
			journey.getBackLink({ params: { manageListAction: 'add' } as never }),
			'/manage-local-plans/PLAN-61797/examination-submission'
		);
	});
});
