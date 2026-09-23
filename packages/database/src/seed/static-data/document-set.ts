import {
	DOCUMENT_CATEGORY_ID,
	DOCUMENT_SET_ID,
	DOCUMENT_SET_FOLDER_NAME,
	GATEWAY_ID,
	NUM_GW3_SUBMISSIONS_QUESTIONS
} from './ids/index.ts';

// Create folder entries to support multiple gw3 submissions
const GATEWAY_3_DOCUMENT_FOLDERS: {
	id: string;
	documentCategoryId: string;
	gatewayId: string;
	displayName: string;
	folderName: string;
	displayOrder: number;
}[] = [];
for (let i = 1; i < NUM_GW3_SUBMISSIONS_QUESTIONS; i++) {
	const key = `G3_DOCUMENT_${i}`;
	GATEWAY_3_DOCUMENT_FOLDERS.push({
		id: DOCUMENT_SET_ID[key],
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: `Gateway 3 Document ${i}`,
		folderName: DOCUMENT_SET_FOLDER_NAME[key as keyof typeof DOCUMENT_SET_FOLDER_NAME],
		displayOrder: i
	});
}

export const DOCUMENT_SET = [
	{
		id: DOCUMENT_SET_ID.SIGNED_SLA,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_1,
		displayName: 'Signed SLA',
		folderName: DOCUMENT_SET_FOLDER_NAME.SIGNED_SLA,
		displayOrder: 1
	},
	{
		id: DOCUMENT_SET_ID.G2_COVER_LETTER,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Gateway 2 Covering Letter',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_COVER_LETTER,
		displayOrder: 1
	},
	{
		id: DOCUMENT_SET_ID.G2_LOCAL_PLAN_TIMETABLE,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Local plan timetable',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_LOCAL_PLAN_TIMETABLE,
		displayOrder: 2
	},
	{
		id: DOCUMENT_SET_ID.G2_PROJ_INIT_DOC,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Project Initiation Document',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_PROJ_INIT_DOC,
		displayOrder: 3
	},
	{
		id: DOCUMENT_SET_ID.G2_DRAFT_STATEMENT_COMPLIANCE,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Draft statement of compliance',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_DRAFT_STATEMENT_COMPLIANCE,
		displayOrder: 4
	},
	{
		id: DOCUMENT_SET_ID.G2_DRAFT_STATEMENT_SOUNDNESS,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Draft statement of soundness',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_DRAFT_STATEMENT_SOUNDNESS,
		displayOrder: 5
	},

	{
		id: DOCUMENT_SET_ID.G2_NOTICE_OF_INTENTION,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Notice of intention to commence local plan preparation',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_NOTICE_OF_INTENTION,
		displayOrder: 10
	},
	{
		id: DOCUMENT_SET_ID.G2_SCOPING_CONSULATATION_DOCS,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Scoping consultation documents',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_SCOPING_CONSULATATION_DOCS,
		displayOrder: 11
	},
	{
		id: DOCUMENT_SET_ID.G2_CONSULTATION_SUMMARY,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Consultation summary of feedback to scoping consultation',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_CONSULTATION_SUMMARY,
		displayOrder: 12
	},
	{
		id: DOCUMENT_SET_ID.G2_G1_SELF_ASSESSMENT,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Gateway 1 - Self assessment of readiness',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_G1_SELF_ASSESSMENT,
		displayOrder: 13
	},
	{
		id: DOCUMENT_SET_ID.G2_CONSULTATION_ON_PROPOSED,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Consultation on proposed local plan content and evidence documents',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_CONSULTATION_ON_PROPOSED,
		displayOrder: 14
	},
	{
		id: DOCUMENT_SET_ID.G2_SUMMARY_OF_CONSULTATION,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Summary of consultation on proposed local plan content and evidence documents',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_SUMMARY_OF_CONSULTATION,
		displayOrder: 15
	},
	{
		id: DOCUMENT_SET_ID.G2_REPORT,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Gateway 2 Issue Report',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_REPORT,
		displayOrder: 16
	},
	{
		id: DOCUMENT_SET_ID.G2_SUBSEQUENT_WORK_TOWARDS_DRAFT_PLAN,
		documentCategoryId: DOCUMENT_CATEGORY_ID.ADDITIONAL,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Subsequent work towards draft plan',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_SUBSEQUENT_WORK_TOWARDS_DRAFT_PLAN,
		displayOrder: 17
	},
	...GATEWAY_3_DOCUMENT_FOLDERS,

	// Gateway 3 portal required documents
	{
		id: DOCUMENT_SET_ID.G3_PROPOSED_LOCAL_PLAN,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Proposed local plan intended for submission for examination',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_PROPOSED_LOCAL_PLAN,
		displayOrder: 201
	},
	{
		id: DOCUMENT_SET_ID.G3_MAP_OF_POLICIES,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Map of proposed local plan policies',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_MAP_OF_POLICIES,
		displayOrder: 202
	},
	{
		id: DOCUMENT_SET_ID.G3_STATEMENT_OF_COMPLIANCE,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Statement of Compliance',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_STATEMENT_OF_COMPLIANCE,
		displayOrder: 203
	},
	{
		id: DOCUMENT_SET_ID.G3_STATEMENT_OF_SOUNDNESS,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Statement of Soundness',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_STATEMENT_OF_SOUNDNESS,
		displayOrder: 204
	},
	{
		id: DOCUMENT_SET_ID.G3_CONSULTATION_ENGAGEMENT_SUMMARY,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Summary of consultation and engagement activities undertaken in preparing the proposed local plan',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_CONSULTATION_ENGAGEMENT_SUMMARY,
		displayOrder: 205
	},
	{
		id: DOCUMENT_SET_ID.G3_SCOPING_CONSULTATION_SUMMARY,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Summary of scoping consultation',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_SCOPING_CONSULTATION_SUMMARY,
		displayOrder: 206
	},
	{
		id: DOCUMENT_SET_ID.G3_CONSULTATION_CONTENT_EVIDENCE_SUMMARY,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Summary of consultation on proposed local plan content and evidence',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_CONSULTATION_CONTENT_EVIDENCE_SUMMARY,
		displayOrder: 207
	},
	{
		id: DOCUMENT_SET_ID.G3_CONSULTATION_PROPOSED_PLAN_SUMMARY,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Summary of consultation on proposed local plan',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_CONSULTATION_PROPOSED_PLAN_SUMMARY,
		displayOrder: 208
	},
	{
		id: DOCUMENT_SET_ID.G3_PRACTICAL_ARRANGEMENTS_STATEMENT,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Statement setting out practical arrangements demonstrating readiness for examination',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_PRACTICAL_ARRANGEMENTS_STATEMENT,
		displayOrder: 209
	},

	// Gateway 3 portal optional documents
	{
		id: DOCUMENT_SET_ID.G3_COPIES_OF_REPRESENTATIONS,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Copies of representations',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_COPIES_OF_REPRESENTATIONS,
		displayOrder: 210
	},
	{
		id: DOCUMENT_SET_ID.G3_SUPPLEMENTARY_PLANS_STATEMENT,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Supplementary plans statement',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_SUPPLEMENTARY_PLANS_STATEMENT,
		displayOrder: 211
	},
	{
		id: DOCUMENT_SET_ID.G3_ENVIRONMENTAL_REPORT,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Environmental report',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_ENVIRONMENTAL_REPORT,
		displayOrder: 212
	},
	{
		id: DOCUMENT_SET_ID.G3_STATEMENT_OF_REASONS_DETERMINATION,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName:
			'Statement of reasons for a determination that the proposed local plan is unlikely to have significant environmental effects',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_STATEMENT_OF_REASONS_DETERMINATION,
		displayOrder: 213
	},
	{
		id: DOCUMENT_SET_ID.G3_REPRESENTATIONS_PROGRESS_SUMMARY,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName:
			'Summary of representations relating to progress towards meeting prescribed requirements and the LPA response',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_REPRESENTATIONS_PROGRESS_SUMMARY,
		displayOrder: 214
	},
	{
		id: DOCUMENT_SET_ID.G3_GATEWAY_2_ISSUES_SUMMARY,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Summary of how Gateway 2 assessor issues have been addressed',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_GATEWAY_2_ISSUES_SUMMARY,
		displayOrder: 215
	},
	{
		id: DOCUMENT_SET_ID.G3_CHANGES_SINCE_CONSULTATION_STATEMENT,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName:
			'Statement explaining changes since the proposed local plan consultation, reasons for those changes, and any additional consultation',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_CHANGES_SINCE_CONSULTATION_STATEMENT,
		displayOrder: 216
	},
	{
		id: DOCUMENT_SET_ID.G3_OTHER_DOCUMENTS,
		documentCategoryId: DOCUMENT_CATEGORY_ID.ADDITIONAL,
		gatewayId: GATEWAY_ID.GATEWAY_3,
		displayName: 'Other documents',
		folderName: DOCUMENT_SET_FOLDER_NAME.G3_OTHER_DOCUMENTS,
		displayOrder: 217
	}
];
