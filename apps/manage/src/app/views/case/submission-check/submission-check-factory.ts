import { type SubmissionCheck } from './submission-check.ts';
import { SignedSLASubmissionCheck } from './signed-sla-submission-check.ts';
import { Gateway2ReportSubmissionCheck } from './gateway-2-report-submission-check.ts';
import { Gateway3SubmissionCheck } from './gateway-3-submission-check.ts';

const OPTIONS: Record<string, new () => SubmissionCheck> = {
	'signed-sla': SignedSLASubmissionCheck,
	'gateway-2-report': Gateway2ReportSubmissionCheck,
	'gateway-3-document': Gateway3SubmissionCheck
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
