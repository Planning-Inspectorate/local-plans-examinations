import { DOCUMENT_CATEGORY_ID, DOCUMENT_SET_ID, DOCUMENT_SET_FOLDER_NAME, GATEWAY_ID } from './ids/index.ts';

export const DOCUMENT_SET = [
	{
		id: DOCUMENT_SET_ID.G2_COVER_LETTER,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Gateway 2 Covering Letter',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_COVER_LETTER,
		displayOrder: 1
	},
	{
		id: DOCUMENT_SET_ID.G2_PROJ_INIT_DOC,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Project Initiation Document',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_PROJ_INIT_DOC,
		displayOrder: 2
	},
	{
		id: DOCUMENT_SET_ID.G2_DRAFT_STATEMENT_COMPLIANCE,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Draft statement of compliance',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_DRAFT_STATEMENT_COMPLIANCE,
		displayOrder: 3
	},
	{
		id: DOCUMENT_SET_ID.G2_DRAFT_STATEMENT_SOUNDNESS,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		gatewayId: GATEWAY_ID.GATEWAY_2,
		displayName: 'Draft statement of soundness',
		folderName: DOCUMENT_SET_FOLDER_NAME.G2_DRAFT_STATEMENT_SOUNDNESS,
		displayOrder: 4
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
	}
];
