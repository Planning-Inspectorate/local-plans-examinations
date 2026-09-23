import { DOCUMENT_CATEGORY_ID, DOCUMENT_SET_ID, DOCUMENT_SET_FOLDER_NAME, GATEWAY_ID } from './ids/index.ts';
import { NUM_GW3_SUBMISSIONS_QUESTIONS } from '@pins/local-plans-lib/util/constants.ts';

// Create folder entries to support multiple gw3 submissions
const GATEWAY_3_DOCUMENT_FOLDERS: {
	id: string;
	documentCategoryId: string;
	gatewayId: string;
	displayName: string;
	folderName: string;
	displayOrder: number;
}[] = [];

const gw3DocumentSetIdPrefixNames = {
	G3_DOCUMENT: { title: 'Gateway 3 Document', category: DOCUMENT_CATEGORY_ID.PROCEDURAL },
	G3_EXAM_WEBSITE: { title: 'Examination website', category: DOCUMENT_CATEGORY_ID.PROCEDURAL },
	G3_PROPOSED_PLAN: {
		title: 'Proposed local plan intended for submission for examination',
		category: DOCUMENT_CATEGORY_ID.PROCEDURAL
	},
	G3_MAP_OF_PROPOSED_PLAN: { title: 'Map of proposed local plan policies', category: DOCUMENT_CATEGORY_ID.PROCEDURAL },
	G3_STATEMENT_OF_COMPLIANCE: { title: 'Statement of Compliance', category: DOCUMENT_CATEGORY_ID.PROCEDURAL },
	G3_STATEMENT_OF_SOUNDNESS: { title: 'Statement of Soundness', category: DOCUMENT_CATEGORY_ID.PROCEDURAL },
	G3_SUMMARY_OF_ENGAGEMENT: {
		title: 'Summary of consultation and engagement activities undertaken in preparing the proposed local plan',
		category: DOCUMENT_CATEGORY_ID.CONSULATION
	},
	G3_SUMMARY_OF_SCOPING_CONSULTATION: {
		title: 'Summary of scoping consultation',
		category: DOCUMENT_CATEGORY_ID.CONSULATION
	},
	G3_SUMMARY_OF_CONSULTATION_AND_EVIDENCE: {
		title: 'Summary of consultation on proposed local plan content and evidence',
		category: DOCUMENT_CATEGORY_ID.CONSULATION
	},
	G3_SUMMARY_OF_CONSULTATION: {
		title: 'Summary of consultation on proposed local plan',
		category: DOCUMENT_CATEGORY_ID.CONSULATION
	},
	G3_STATEMENT_OF_PRACTICAL_ARRANGEMENTS: {
		title: 'Statement setting out practical arrangements demonstrating readiness for examination',
		category: DOCUMENT_CATEGORY_ID.PROCEDURAL
	},
	G3_COPIES_OF_REPRESENTATIONS: { title: 'Copies of representations', category: DOCUMENT_CATEGORY_ID.PROCEDURAL },
	G3_SUPPLEMENTARY_EXAMS_STATEMENT: {
		title: 'Supplementary plans statement',
		category: DOCUMENT_CATEGORY_ID.PROCEDURAL
	},
	G3_ENVIRONMENTAL_REPORT: { title: 'Environmental report', category: DOCUMENT_CATEGORY_ID.PROCEDURAL },
	G3_STATEMENT_OF_ENVIRONMENT_REASONS: {
		title:
			'Statement of reasons for a determination that the proposed local plan is unlikely to have significant environmental effects',
		category: DOCUMENT_CATEGORY_ID.PROCEDURAL
	},
	G3_SUMMARY_OF_REPRESENTATIONS: {
		title:
			'Summary of representations relating to progress towards meeting prescribed requirements and the LPA response',
		category: DOCUMENT_CATEGORY_ID.PROCEDURAL
	},
	G3_SUMMARY_OF_GW2_REMEDIATIONS: {
		title: 'Summary of how Gateway 2 assessor issues have been addressed',
		category: DOCUMENT_CATEGORY_ID.PROCEDURAL
	},
	G3_SUMMARY_OF_CHANGES: {
		title:
			'Statement explaining changes since the proposed local plan consultation, reasons for those changes, and any additional consultation',
		category: DOCUMENT_CATEGORY_ID.CONSULATION
	},
	G3_OTHER_DOCUMENTS: { title: 'Other documents', category: DOCUMENT_CATEGORY_ID.ADDITIONAL }
};
for (let i = 1; i < NUM_GW3_SUBMISSIONS_QUESTIONS; i++) {
	GATEWAY_3_DOCUMENT_FOLDERS.push(
		...Object.entries(gw3DocumentSetIdPrefixNames).map(([variablePrefix, details], index) => ({
			id: DOCUMENT_SET_ID[`${variablePrefix}_${i}`],
			documentCategoryId: details.category,
			gatewayId: GATEWAY_ID.GATEWAY_3,
			displayName: `${details.title} ${i}`,
			folderName: DOCUMENT_SET_FOLDER_NAME[`${variablePrefix}_${i}` as keyof typeof DOCUMENT_SET_FOLDER_NAME],
			displayOrder: i + index
		}))
	);
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
	...GATEWAY_3_DOCUMENT_FOLDERS
];
