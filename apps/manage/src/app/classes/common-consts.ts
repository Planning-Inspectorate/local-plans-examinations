export const COMMON_CONSTS = {
	OVERVIEW_JOURNEY_ID: 'edit-case-overview',
	GATEWAY_1_JOURNEY_ID: 'gateway-1',
	GATEWAY_2_JOURNEY_ID: 'gateway-2',
	GATEWAY_2_WORKSHOP_JOURNEY_ID: 'gateway-2-workshop',
	GATEWAY_3_JOURNEY_ID: 'gateway-3',
	GATEWAY_3_REPORT_JOURNEY_ID: 'gateway-3-report',
	EXAMINATION_JOURNEY_ID: 'examination',
	EXAMINATION_HEARING_JOURNEY_ID: 'examination-hearing',
	EXAMINATION_REPORT_QUESTION: 'examination-report',
	EXAMINATION_REPORT_MANAGE_QUESTION: 'examination-report-manage',
	EXAMINATION_PAUSE_JOURNEY_ID: 'examination-pause',
	TIMETABLE_JOURNEY_ID: 'timetable',
	OVERVIEW: 'overview',
	GATEWAY_2_INFO: 'gateway2Info',
	GATEWAY_3_INFO: 'gateway3Info',
	EXAMINATION_INFO: 'examinationInfo',
	ASSESSOR_GATEWAY_2_QUESTION: 'assessor-gateway-2',
	ASSESSOR_GATEWAY_3_QUESTION: 'assessor-gateway-3',
	PROGRAMME_OFFICER_QUESTION: 'programme-officer',
	CHECK_LPAS_QUESTION: 'check-lpas',
	CHECK_CONTACT_DETAILS_QUESTION: 'check-contact-details',
	EXAMINING_INSPECTOR_1_QUESTION: 'examining-inspector-1',
	EXAMINING_INSPECTOR_2_QUESTION: 'examining-inspector-2',
	EXAMINING_INSPECTOR_3_QUESTION: 'examining-inspector-3',
	EXAMINATION_WEBSITE_QUESTION: 'examination-website',
	QA_INSPECTOR_1_QUESTION: 'qa-inspector-1',
	QA_INSPECTOR_2_QUESTION: 'qa-inspector-2',
	QA_INSPECTOR_3_QUESTION: 'qa-inspector-3',
	SIGNED_SLA_QUESTION: 'signed-sla',
	GATEWAY_2_ASSESSOR_QUESTION: 'gateway-2-assessor',
	GATEWAY_2_REPORT_QUESTION: 'gateway-2-report',
	GATEWAY_2_REPORT_ISSUED_DATE_QUESTION: 'gateway-2-report-issued-date',
	GATEWAY_2_WORKSHOP_DOCUMENTS_QUESTION: 'gateway-2-workshop-documents',
	GATEWAY_3_ASSESSOR_NAME_QUESTION: 'gateway-3-assessor-name',
	GATEWAY_3_DECISION_QUESTION: 'gateway-3-decision',
	GATEWAY_3_DOCUMENT_QUESTION: 'gateway-3-document',
	GATEWAY_3_REPORT_ISSUED_DATE_QUESTION: 'gateway-3-report-issued-date',
	NUM_EXAM_PAUSE_QUESTIONS: 200,
	DELETE_CASE_JOURNEY_ID: 'delete-case',
	DELETE_CASE_SECTION: 'delete-case',
	DELETE_CASE_REASON: 'delete-case-reason',
	MIQS_QUESTION: 'miqs',
	GATEWAY_2_DOCUMENT_QUESTIONS: [
		'covering-letter',
		'local-plan-timetable',
		'project-initiation-document',
		'draft-stat-compliance',
		'notice-of-intent',
		'g1-self-assess',
		'cons-of-proposed',
		'draft-stat-soundness',
		'scoping-cons',
		'cons-summ',
		'summary-of-consultation',
		'subsequent-work-towards-a-draft-plan'
	]
};
export const GATEWAY_SUBMISSION_FILE_UPLOAD_LIMIT_BYTES = 250 * 1000 * 1000; // 250MB
export const GATEWAY_2_WORKSHOP_DOCUMENTS_FILE_UPLOAD_LIMIT_BYTES = 25 * 10000 * 1000; // 250MB
export const SIGNED_SLA_FILE_UPLOAD_LIMIT_BYTES = 25 * 10000 * 1000; // 250MB
export const NUM_EXAMINATION_HEARING_QUESTIONS = 200;

export const questionPrefix = [
	'examination-hearing-location-type-',
	'examination-hearing-remote-meeting-link-known-',
	'examination-hearing-location-known-'
];
