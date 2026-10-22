export const NUM_GW2_WORKSHOP_QUESTIONS = 200;
export const NUM_GW3_SUBMISSIONS_QUESTIONS = 200;

// Create multiple entries to support multiple gw3 submissions
const GATEWAY_3_DOCUMENT_FOLDERS: Record<string, string> = {};
const GATEWAY_3_DOCUMENT_SET_IDS: Record<string, string> = {};
for (let i = 1; i < NUM_GW3_SUBMISSIONS_QUESTIONS; i++) {
	GATEWAY_3_DOCUMENT_FOLDERS[`G3_DOCUMENT_${i}`] = `gateway-3-document-${i}`;
	GATEWAY_3_DOCUMENT_SET_IDS[`G3_DOCUMENT_${i}`] = `g3-document-${i}`;
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
	G2_WORKSHOP_DOCUMENTS: 'g2-workshop-docs',
	...GATEWAY_3_DOCUMENT_SET_IDS,

	// Gateway 3 portal required documents
	G3_PROPOSED_LOCAL_PLAN: 'g3-proposed-plan',
	G3_MAP_OF_POLICIES: 'g3-map-of-policies',
	G3_STATEMENT_OF_COMPLIANCE: 'g3-stat-compliance',
	G3_STATEMENT_OF_SOUNDNESS: 'g3-stat-soundness',
	G3_CONSULTATION_ENGAGEMENT_SUMMARY: 'g3-cons-engage-summ',
	G3_SCOPING_CONSULTATION_SUMMARY: 'g3-scoping-cons-sum',
	G3_CONSULTATION_CONTENT_EVIDENCE_SUMMARY: 'g3-cons-content-sum',
	G3_CONSULTATION_PROPOSED_PLAN_SUMMARY: 'g3-cons-plan-summ',
	G3_PRACTICAL_ARRANGEMENTS_STATEMENT: 'g3-practical-arrng',

	// Gateway 3 portal optional documents
	G3_COPIES_OF_REPRESENTATIONS: 'g3-copies-of-reps',
	G3_SUPPLEMENTARY_PLANS_STATEMENT: 'g3-supp-plans-stmt',
	G3_ENVIRONMENTAL_REPORT: 'g3-env-report',
	G3_STATEMENT_OF_REASONS_DETERMINATION: 'g3-stmt-reasons',
	G3_REPRESENTATIONS_PROGRESS_SUMMARY: 'g3-reps-progress',
	G3_GATEWAY_2_ISSUES_SUMMARY: 'g3-g2-issues-summ',
	G3_CHANGES_SINCE_CONSULTATION_STATEMENT: 'g3-changes-stmt',
	G3_OTHER_DOCUMENTS: 'g3-other-documents',

	// Examination portal documents
	EX_LOCAL_PLAN: 'ex-local-plan',
	EX_MAP_OF_POLICIES: 'ex-map-policies',
	EX_G3_COMPLETION: 'ex-g3-completion',
	EX_CONSULTATION_ENGAGEMENT: 'ex-cons-engagement',
	EX_CONSULTATION_PLAN: 'ex-cons-plan',
	EX_SPATIAL_STRATEGY_REPS: 'ex-spatial-reps',
	EX_STATEMENT_COMPLIANCE: 'ex-compliance',
	EX_STATEMENT_SOUNDNESS: 'ex-soundness',
	EX_ENVIRONMENTAL_REPORT: 'ex-env-report',
	EX_ENVIRONMENTAL_EFFECTS: 'ex-env-effects',
	EX_ADDITIONAL_EVIDENCE: 'ex-add-evidence',
	EX_CHANGES_SINCE_G3: 'ex-changes-g3',
	EX_G3_REPORT_REPS: 'ex-g3-report-reps',

	// Consultantion
	G2_NOTICE_OF_INTENTION: 'g2-notice-intent',
	G2_SCOPING_CONSULATATION_DOCS: 'g2-scoping-cons',
	G2_CONSULTATION_SUMMARY: 'g2-cons-summ',
	G2_G1_SELF_ASSESSMENT: 'g2-g1-self-assess',
	G2_CONSULTATION_ON_PROPOSED: 'g2-cons-of-proposed',
	G2_SUMMARY_OF_CONSULTATION: 'g2-sum-of-cons',
	G2_SUBSEQUENT_WORK_TOWARDS_DRAFT_PLAN: 'g2-subsequent-work',

	// Other
	EXAMINATION_REPORT: 'exam-report'
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
	G2_WORKSHOP_DOCUMENTS: 'gateway-2-workshop-documents',
	...GATEWAY_3_DOCUMENT_FOLDERS,

	// Gateway 3 portal required documents
	G3_PROPOSED_LOCAL_PLAN: 'proposed-local-plan',
	G3_MAP_OF_POLICIES: 'map-of-policies',
	G3_STATEMENT_OF_COMPLIANCE: 'statement-of-compliance',
	G3_STATEMENT_OF_SOUNDNESS: 'statement-of-soundness',
	G3_CONSULTATION_ENGAGEMENT_SUMMARY: 'consultation-engagement-summary',
	G3_SCOPING_CONSULTATION_SUMMARY: 'scoping-consultation-summary',
	G3_CONSULTATION_CONTENT_EVIDENCE_SUMMARY: 'consultation-content-evidence-summary',
	G3_CONSULTATION_PROPOSED_PLAN_SUMMARY: 'consultation-proposed-plan-summary',
	G3_PRACTICAL_ARRANGEMENTS_STATEMENT: 'practical-arrangements-statement',

	// Gateway 3 portal optional documents
	G3_COPIES_OF_REPRESENTATIONS: 'copies-of-representations',
	G3_SUPPLEMENTARY_PLANS_STATEMENT: 'supplementary-plans-statement',
	G3_ENVIRONMENTAL_REPORT: 'environmental-report',
	G3_STATEMENT_OF_REASONS_DETERMINATION: 'statement-of-reasons-determination',
	G3_REPRESENTATIONS_PROGRESS_SUMMARY: 'representations-progress-summary',
	G3_GATEWAY_2_ISSUES_SUMMARY: 'gateway-2-issues-summary',
	G3_CHANGES_SINCE_CONSULTATION_STATEMENT: 'changes-since-consultation-statement',
	G3_OTHER_DOCUMENTS: 'other-documents',

	// Examination portal documents
	EX_LOCAL_PLAN: 'examination-local-plan-submission',
	EX_MAP_OF_POLICIES: 'examination-map-of-proposed-local-plan-policies',
	EX_G3_COMPLETION: 'examination-gateway-3-completion-statement',
	EX_CONSULTATION_ENGAGEMENT: 'examination-consultation-engagement-activities',
	EX_CONSULTATION_PLAN: 'examination-consultation-on-proposed-local-plan',
	EX_SPATIAL_STRATEGY_REPS: 'examination-spatial-development-strategy-representations',
	EX_STATEMENT_COMPLIANCE: 'examination-statement-of-compliance',
	EX_STATEMENT_SOUNDNESS: 'examination-statement-of-soundness',
	EX_ENVIRONMENTAL_REPORT: 'examination-environmental-report',
	EX_ENVIRONMENTAL_EFFECTS: 'examination-unlikely-significant-environmental-effects',
	EX_ADDITIONAL_EVIDENCE: 'examination-additional-evidence-documents',
	EX_CHANGES_SINCE_G3: 'examination-changes-since-gateway-3',
	EX_G3_REPORT_REPS: 'examination-gateway-3-report-representations',

	// Consultantion
	G2_NOTICE_OF_INTENTION: 'notice-of-intent',
	G2_SCOPING_CONSULATATION_DOCS: 'scoping-cons',
	G2_CONSULTATION_SUMMARY: 'cons-summ',
	G2_G1_SELF_ASSESSMENT: 'g1-self-assess',
	G2_CONSULTATION_ON_PROPOSED: 'cons-of-proposed',
	G2_SUMMARY_OF_CONSULTATION: 'summary-of-consultation',
	G2_SUBSEQUENT_WORK_TOWARDS_DRAFT_PLAN: 'subsequent-work-towards-a-draft-plan',

	// Other
	EXAMINATION_REPORT: 'examination-report'
};
export const gateway2SetIds = [
	DOCUMENT_SET_ID.G2_COVER_LETTER,
	DOCUMENT_SET_ID.G2_LOCAL_PLAN_TIMETABLE,
	DOCUMENT_SET_ID.G2_PROJ_INIT_DOC,
	DOCUMENT_SET_ID.G2_DRAFT_STATEMENT_COMPLIANCE,
	DOCUMENT_SET_ID.G2_DRAFT_STATEMENT_SOUNDNESS,
	DOCUMENT_SET_ID.G2_REPORT,
	DOCUMENT_SET_ID.G2_WORKSHOP_DOCUMENTS,
	DOCUMENT_SET_ID.G2_NOTICE_OF_INTENTION,
	DOCUMENT_SET_ID.G2_SCOPING_CONSULATATION_DOCS,
	DOCUMENT_SET_ID.G2_CONSULTATION_SUMMARY,
	DOCUMENT_SET_ID.G2_G1_SELF_ASSESSMENT,
	DOCUMENT_SET_ID.G2_CONSULTATION_ON_PROPOSED,
	DOCUMENT_SET_ID.G2_SUMMARY_OF_CONSULTATION,
	DOCUMENT_SET_ID.G2_SUBSEQUENT_WORK_TOWARDS_DRAFT_PLAN
];
export const gateway3SetIds = [
	DOCUMENT_SET_ID.G3_PROPOSED_LOCAL_PLAN,
	DOCUMENT_SET_ID.G3_MAP_OF_POLICIES,
	DOCUMENT_SET_ID.G3_STATEMENT_OF_COMPLIANCE,
	DOCUMENT_SET_ID.G3_STATEMENT_OF_SOUNDNESS,
	DOCUMENT_SET_ID.G3_CONSULTATION_ENGAGEMENT_SUMMARY,
	DOCUMENT_SET_ID.G3_SCOPING_CONSULTATION_SUMMARY,
	DOCUMENT_SET_ID.G3_CONSULTATION_CONTENT_EVIDENCE_SUMMARY,
	DOCUMENT_SET_ID.G3_CONSULTATION_PROPOSED_PLAN_SUMMARY,
	DOCUMENT_SET_ID.G3_PRACTICAL_ARRANGEMENTS_STATEMENT,
	DOCUMENT_SET_ID.G3_COPIES_OF_REPRESENTATIONS,
	DOCUMENT_SET_ID.G3_SUPPLEMENTARY_PLANS_STATEMENT,
	DOCUMENT_SET_ID.G3_ENVIRONMENTAL_REPORT,
	DOCUMENT_SET_ID.G3_STATEMENT_OF_REASONS_DETERMINATION,
	DOCUMENT_SET_ID.G3_REPRESENTATIONS_PROGRESS_SUMMARY,
	DOCUMENT_SET_ID.G3_GATEWAY_2_ISSUES_SUMMARY,
	DOCUMENT_SET_ID.G3_CHANGES_SINCE_CONSULTATION_STATEMENT,
	DOCUMENT_SET_ID.G3_OTHER_DOCUMENTS,
	...Object.values(GATEWAY_3_DOCUMENT_SET_IDS)
];

export const examinationSetIds = [
	DOCUMENT_SET_ID.EX_LOCAL_PLAN,
	DOCUMENT_SET_ID.EX_MAP_OF_POLICIES,
	DOCUMENT_SET_ID.EX_G3_COMPLETION,
	DOCUMENT_SET_ID.EX_CONSULTATION_ENGAGEMENT,
	DOCUMENT_SET_ID.EX_CONSULTATION_PLAN,
	DOCUMENT_SET_ID.EX_SPATIAL_STRATEGY_REPS,
	DOCUMENT_SET_ID.EX_STATEMENT_COMPLIANCE,
	DOCUMENT_SET_ID.EX_STATEMENT_SOUNDNESS,
	DOCUMENT_SET_ID.EX_ENVIRONMENTAL_REPORT,
	DOCUMENT_SET_ID.EX_ENVIRONMENTAL_EFFECTS,
	DOCUMENT_SET_ID.EX_ADDITIONAL_EVIDENCE,
	DOCUMENT_SET_ID.EX_CHANGES_SINCE_G3,
	DOCUMENT_SET_ID.EX_G3_REPORT_REPS
];
