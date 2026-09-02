import { getSubmissionCheckForQuestion } from './submission-check-factory.ts';
import { SubmissionCheck } from './submission-check.ts';
import { SignedSLASubmissionCheck } from './signed-sla-submission-check.ts';
import { Gateway2ReportSubmissionCheck } from './gateway-2-report-submission-check.ts';
import { Gateway3SubmissionCheck } from './gateway-3-submission-check.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('test getSubmissionCheckForQuestion', () => {
	describe('can fetch SubmissionCheck objects for all questions', () => {
		const testCases: Record<string, new () => SubmissionCheck> = {
			'signed-sla': SignedSLASubmissionCheck,
			'gateway-2-report': Gateway2ReportSubmissionCheck,
			'gateway-3-document': Gateway3SubmissionCheck
		};
		for (const question of Object.keys(testCases)) {
			const expectedSubmissionCheck = testCases[question];
			it(`should fetch the correct SubmissionCheck for question '${question}'`, () => {
				const actualSubmissionCheck = getSubmissionCheckForQuestion(question);
				assert.equal(actualSubmissionCheck, expectedSubmissionCheck);
			});
		}
	});
	it('throws an exception when an unknown question is provided', () => {
		assert.rejects(async () => {
			getSubmissionCheckForQuestion('some unknown question');
		});
	});
});
