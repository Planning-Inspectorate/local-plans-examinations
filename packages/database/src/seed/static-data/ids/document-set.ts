import { NUM_GW3_SUBMISSIONS_QUESTIONS } from '@pins/local-plans-lib/util/constants.ts';

// Create multiple entries to support multiple gw3 submissions
const GATEWAY_3_DOCUMENT_FOLDERS: Record<string, string> = {};
const GATEWAY_3_DOCUMENT_SET_IDS: Record<string, string> = {};
for (let i = 1; i < NUM_GW3_SUBMISSIONS_QUESTIONS; i++) {
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_DOCUMENT_${i}`] = `gateway-3-document-${i}`; // Final report in BO
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_DOCUMENT_${i}`] = `g3-document-${i}`; // Final report in BO
	// Required FO
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_EXAM_WEBSITE_${i}`] = `gateway-3-document-exam-website-${i}`; // Examination website
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_EXAM_WEBSITE_${i}`] = `g3-document-exam-website-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_PROPOSED_PLAN_${i}`] = `gateway-3-document-proposed-plan-${i}`; // Proposed local plan intended for submission for examination
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_PROPOSED_PLAN_${i}`] = `g3-document-proposed-plan-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_MAP_OF_PROPOSED_PLAN_${i}`] = `gateway-3-document-map-of-proposed-plan-${i}`; // Map of proposed local plan policies
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_MAP_OF_PROPOSED_PLAN_${i}`] = `g3-document-map-of-proposed-plan-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_STATEMENT_OF_COMPLIANCE_${i}`] = `gateway-3-document-statement-of-compliance-${i}`; // Statement of Compliance
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_STATEMENT_OF_COMPLIANCE_${i}`] = `g3-document-statement-of-compliance-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_STATEMENT_OF_SOUNDNESS_${i}`] = `gateway-3-document-statement-of-soundness-${i}`; // Statement of Soundness
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_STATEMENT_OF_SOUNDNESS_${i}`] = `g3-document-statement-of-soundness-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_SUMMARY_OF_ENGAGEMENT_${i}`] = `gateway-3-document-summary-of-engagement-${i}`; // Summary of consultation and engagement activities undertaken in preparing the proposed local plan
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_SUMMARY_OF_ENGAGEMENT_${i}`] = `g3-document-summary-of-engagement-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_SUMMARY_OF_SCOPING_CONSULTATION_${i}`] =
		`gateway-3-document-summary-of-scoping-consultation-${i}`; // Summary of scoping consultation
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_SUMMARY_OF_SCOPING_CONSULTATION_${i}`] =
		`g3-document-summary-of-scoping-consultation-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_SUMMARY_OF_CONSULTATION_AND_EVIDENCE_${i}`] =
		`gateway-3-document-summary-of-consultation-and-evidence-${i}`; // Summary of consultation on proposed local plan content and evidence
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_SUMMARY_OF_CONSULTATION_AND_EVIDENCE_${i}`] =
		`g3-document-summary-of-consultation-and-evidence-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_SUMMARY_OF_CONSULTATION_${i}`] = `gateway-3-document-summary-of-consultation-${i}`; // Summary of consultation on proposed local plan
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_SUMMARY_OF_CONSULTATION_${i}`] = `g3-document-summary-of-consultation-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_STATEMENT_OF_PRACTICAL_ARRANGEMENTS_${i}`] =
		`gateway-3-document-statement-of-practical-arrangements-${i}`; // Statement setting out practical arrangements demonstrating readiness for examination
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_STATEMENT_OF_PRACTICAL_ARRANGEMENTS_${i}`] =
		`g3-document-statement-of-practical-arrangements-${i}`;
	// Optional FO
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_COPIES_OF_REPRESENTATIONS_${i}`] = `gateway-3-document-copies-of-representations-${i}`; // Copies of representations
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_COPIES_OF_REPRESENTATIONS_${i}`] = `g3-document-copies-of-representations-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_SUPPLEMENTARY_EXAMS_STATEMENT_${i}`] =
		`gateway-3-document-supplementary-exams-statement-${i}`; // Supplementary plans statement
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_SUPPLEMENTARY_EXAMS_STATEMENT_${i}`] =
		`g3-document-supplementary-exams-statement-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_ENVIRONMENTAL_REPORT_${i}`] = `gateway-3-document-environmental-report-${i}`; // Environmental report
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_ENVIRONMENTAL_REPORT_${i}`] = `g3-document-environmental-report-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_STATEMENT_OF_ENVIRONMENT_REASONS_${i}`] =
		`gateway-3-document-statement-of-environment-reasons-${i}`; // Statement of reasons for a determination that the proposed local plan is unlikely to have significant environmental effects
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_STATEMENT_OF_ENVIRONMENT_REASONS_${i}`] =
		`g3-document-statement-of-environment-reasons-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_SUMMARY_OF_REPRESENTATIONS_${i}`] =
		`gateway-3-document-summary-of-representations-${i}`; // Summary of representations relating to progress towards meeting prescribed requirements and the LPA response
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_SUMMARY_OF_REPRESENTATIONS_${i}`] = `g3-document-summary-of-representations-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_SUMMARY_OF_GW2_REMEDIATIONS_${i}`] =
		`gateway-3-document-summary-of-gw2-remediations-${i}`; // Summary of how Gateway 2 assessor issues have been addressed
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_SUMMARY_OF_GW2_REMEDIATIONS_${i}`] = `g3-document-summary-of-gw2-remediations-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_SUMMARY_OF_CHANGES_${i}`] = `gateway-3-document-summary-of-changes-${i}`; // Statement explaining changes since the proposed local plan consultation, reasons for those changes, and any additional consultation
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_SUMMARY_OF_CHANGES_${i}`] = `g3-document-summary-of-changes-${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_OTHER_DOCUMENTS_${i}`] = `gateway-3-document-other-documents-${i}`; // Other documents
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_OTHER_DOCUMENTS_${i}`] = `g3-document-other-documents-${i}`;
}

export const DOCUMENT_SET_ID: Record<string, string> = {
	// Procedural
	SIGNED_SLA: 'signed-sla',
	G2_COVER_LETTER: 'g2-cover-letter',
	G2_LOCAL_PLAN_TIMETABLE: 'g2-timetable',
	G2_PROJ_INIT_DOC: 'g2-init-doc',
	G2_DRAFT_STATEMENT_COMPLIANCE: 'g2-draft-stat-comp',
	G2_DRAFT_STATEMENT_SOUNDNESS: 'g2-draft-stat-sound',
	G2_REPORT: 'g2-report',
	...GATEWAY_3_DOCUMENT_SET_IDS,

	// Consultantion
	G2_NOTICE_OF_INTENTION: 'g2-notice-intent',
	G2_SCOPING_CONSULATATION_DOCS: 'g2-scoping-cons',
	G2_CONSULTATION_SUMMARY: 'g2-cons-summ',
	G2_G1_SELF_ASSESSMENT: 'g2-g1-self-assess',
	G2_CONSULTATION_ON_PROPOSED: 'g2-cons-of-proposed',
	G2_SUMMARY_OF_CONSULTATION: 'g2-sum-of-cons',
	G2_SUBSEQUENT_WORK_TOWARDS_DRAFT_PLAN: 'g2-subsequent-work'
};
export const DOCUMENT_SET_FOLDER_NAME = {
	// Procedural
	SIGNED_SLA: 'signed-sla',
	G2_COVER_LETTER: 'covering-letter',
	G2_LOCAL_PLAN_TIMETABLE: 'local-plan-timetable',
	G2_PROJ_INIT_DOC: 'project-initiation-document',
	G2_DRAFT_STATEMENT_COMPLIANCE: 'draft-stat-compliance',
	G2_DRAFT_STATEMENT_SOUNDNESS: 'draft-stat-soundness',
	G2_REPORT: 'gateway-2-report',
	...GATEWAY_3_DOCUMENT_FOLDERS,

	// Consultantion
	G2_NOTICE_OF_INTENTION: 'notice-of-intent',
	G2_SCOPING_CONSULATATION_DOCS: 'scoping-cons',
	G2_CONSULTATION_SUMMARY: 'cons-summ',
	G2_G1_SELF_ASSESSMENT: 'g1-self-assess',
	G2_CONSULTATION_ON_PROPOSED: 'cons-of-proposed',
	G2_SUMMARY_OF_CONSULTATION: 'summary-of-consultation',
	G2_SUBSEQUENT_WORK_TOWARDS_DRAFT_PLAN: 'subsequent-work-towards-a-draft-plan'
};
export const gateway2SetIds = [
	DOCUMENT_SET_ID.G2_COVER_LETTER,
	DOCUMENT_SET_ID.G2_LOCAL_PLAN_TIMETABLE,
	DOCUMENT_SET_ID.G2_PROJ_INIT_DOC,
	DOCUMENT_SET_ID.G2_DRAFT_STATEMENT_COMPLIANCE,
	DOCUMENT_SET_ID.G2_DRAFT_STATEMENT_SOUNDNESS,
	DOCUMENT_SET_ID.G2_REPORT,
	DOCUMENT_SET_ID.G2_NOTICE_OF_INTENTION,
	DOCUMENT_SET_ID.G2_SCOPING_CONSULATATION_DOCS,
	DOCUMENT_SET_ID.G2_CONSULTATION_SUMMARY,
	DOCUMENT_SET_ID.G2_G1_SELF_ASSESSMENT,
	DOCUMENT_SET_ID.G2_CONSULTATION_ON_PROPOSED,
	DOCUMENT_SET_ID.G2_SUMMARY_OF_CONSULTATION,
	DOCUMENT_SET_ID.G2_SUBSEQUENT_WORK_TOWARDS_DRAFT_PLAN
];
