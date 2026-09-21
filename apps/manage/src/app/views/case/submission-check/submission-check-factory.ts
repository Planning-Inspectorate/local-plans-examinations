import { type SubmissionCheck } from './submission-check.ts';
import { SignedSLASubmissionCheck } from './signed-sla-submission-check.ts';
import { Gateway2ReportSubmissionCheck } from './gateway-2-report-submission-check.ts';
import { Gateway3SubmissionCheck } from './gateway-3-submission-check.ts';
import { NUM_GW3_SUBMISSIONS_QUESTIONS } from '@pins/local-plans-lib/util/constants.ts';

// Create a map entry for the multiple gw3 submission questions
const GATEWAY3_DOCUMENT_OPTIONS: Record<string, new () => SubmissionCheck> = {};
for (let i = 1; i < NUM_GW3_SUBMISSIONS_QUESTIONS; i++) {
	GATEWAY3_DOCUMENT_OPTIONS[`gateway-3-document-${i}`] = Gateway3SubmissionCheck;
}
const OPTIONS: Record<string, new () => SubmissionCheck> = {
	'signed-sla': SignedSLASubmissionCheck,
	'gateway-2-report': Gateway2ReportSubmissionCheck,
	...GATEWAY3_DOCUMENT_OPTIONS
};

/**
 * Factory function for SubmissionCheck, which can be used to dynamically generate a SubmissionCheck object by question
 *
 * ### Example usage
 * ```
 * const submissionCheckClass = getSubmissionCheckForQuestion('some-question');
 * const submissionCheck = new submissionCheckClass(...);
 * const submissionCheckData = await submissionCheck.generateDataForPage();
 * ```
 */
export function getSubmissionCheckForQuestion(question: string) {
	if (question in OPTIONS) {
		return OPTIONS[question];
	}
	throw Error(
		`Could not find a SubmissionCheck class for the question '${question}' in submission-check-factory.ts::OPTIONS`
	);
}
