import { DOCUMENT_CATEGORY_ID, DOCUMENT_SET_ID } from './ids/index.ts';

export const DOCUMENT_SET = [
	{
		id: DOCUMENT_SET_ID.G2_COVER_LETTER,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		displayName: 'Gateway 2 Covering Letter',
		folderName: 'covering-letter',
		displayOrder: 1
	},
	{
		id: DOCUMENT_SET_ID.G2_PROJ_INIT_DOC,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		displayName: 'Project Initiation Document',
		folderName: 'initiation-document',
		displayOrder: 2
	},
	{
		id: DOCUMENT_SET_ID.G2_DRAFT_STATEMENT_COMPLIANCE,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		displayName: 'Draft statement of compliance',
		folderName: 'draft-stat-compliance',
		displayOrder: 3
	},
	{
		id: DOCUMENT_SET_ID.G2_DRAFT_STATEMENT_SOUNDNESS,
		documentCategoryId: DOCUMENT_CATEGORY_ID.PROCEDURAL,
		displayName: 'Draft statement of soundness',
		folderName: 'draft-stat-soundness',
		displayOrder: 4
	},

	{
		id: DOCUMENT_SET_ID.G2_NOTICE_OF_INTENTION,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		displayName: 'Notice of intention to commence local plan preparation',
		folderName: 'notice-of-intent',
		displayOrder: 10
	},
	{
		id: DOCUMENT_SET_ID.G2_SCOPING_CONSULATATION_DOCS,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		displayName: 'Scoping consultation documents',
		folderName: 'scoping-cons',
		displayOrder: 11
	},
	{
		id: DOCUMENT_SET_ID.G2_CONSULTATION_SUMMARY,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		displayName: 'Consultation summary of feedback to scoping consultation',
		folderName: 'cons-summ',
		displayOrder: 12
	},
	{
		id: DOCUMENT_SET_ID.G2_G1_SELF_ASSESSMENT,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		displayName: 'Gateway 1 - Self assessment of readiness',
		folderName: 'g1-self-assess',
		displayOrder: 13
	},
	{
		id: DOCUMENT_SET_ID.G2_CONSULTATION_ON_PROPOSED,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		displayName: 'Consultation on proposed local plan content and evidence documents',
		folderName: 'cons-of-proposed',
		displayOrder: 14
	},
	{
		id: DOCUMENT_SET_ID.G2_SUMMARY_OF_CONSULTATION,
		documentCategoryId: DOCUMENT_CATEGORY_ID.CONSULATION,
		displayName: 'Summary of consultation on proposed local plan content and evidence documents',
		folderName: 'sum-of-cons',
		displayOrder: 15
	}
];

export const documentCategories = [
	{
		gatewayId: 'G2',
		displayName: 'Procedural',
		folderName: 'procedural',
		displayOrder: 1,
		documentSets: [
			{
				displayName: 'Gateway 2 Covering Letter',
				folderName: 'covering-letter',
				displayOrder: 1
			},
			{
				displayName: 'Project Initiation Document',
				folderName: 'initiation-document',
				displayOrder: 2
			}
		]
	},
	{
		gatewayId: 'G3',
		displayName: 'Consultation',
		folderName: 'consultation',
		displayOrder: 1,
		documentSets: [
			{
				displayName: 'Notice of intention to commence local plan preparation',
				folderName: 'notice-of-intention',
				displayOrder: 1
			},
			{
				displayName: 'Scoping consultation documents',
				folderName: 'scoping-consultation-documents',
				displayOrder: 2
			}
		]
	}
];
