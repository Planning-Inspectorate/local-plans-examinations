import { type SubmissionCheck } from './submission-check.ts';
import { SignedSLASubmissionCheck } from './signed-sla-submission-check.ts';
import { Gateway2ReportSubmissionCheck } from './gateway-2-report-submission-check.ts';
import { Gateway3SubmissionCheck } from './gateway-3-submission-check.ts';
import { Gateway2WorkshopDocumentsSubmissionCheck } from './gateway-2-workshop-documents-submission-check.ts';
import { ExaminationReportSubmissionCheck } from './examination-report-submission-check.ts';
import { MiqsSubmissionCheck } from './miqs-submission-check.ts';
import { NUM_GW3_SUBMISSIONS_QUESTIONS } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { Gateway2DocumentSubmissionCheck } from './gateway-2-document-submission-check.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';

// Create a map entry for the multiple gw3 submission questions
const GATEWAY3_DOCUMENT_OPTIONS: Record<string, new () => SubmissionCheck> = {};
for (let i = 1; i < NUM_GW3_SUBMISSIONS_QUESTIONS; i++) {
	GATEWAY3_DOCUMENT_OPTIONS[`gateway-3-document-${i}`] = Gateway3SubmissionCheck;
}
const OPTIONS: Record<string, new () => SubmissionCheck> = {
	'signed-sla': SignedSLASubmissionCheck,
	'gateway-2-report': Gateway2ReportSubmissionCheck,
	'gateway-2-workshop-documents': Gateway2WorkshopDocumentsSubmissionCheck,
	'examination-report': ExaminationReportSubmissionCheck,
	miqs: MiqsSubmissionCheck,
	...Object.fromEntries(
		COMMON_CONSTS.GATEWAY_2_DOCUMENT_QUESTIONS.map((questionUrl) => [questionUrl, Gateway2DocumentSubmissionCheck])
	),
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
