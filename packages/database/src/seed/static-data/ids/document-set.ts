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
