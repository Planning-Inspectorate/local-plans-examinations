import { CUSTOM_COMPONENTS } from '@pins/local-plans-lib/forms/custom-components/index.ts';
import { FileUploadRequiredValidator } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import {
	SINGLE_FILE_UPLOAD_LIMIT,
	SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	TOTAL_FILE_UPLOAD_LIMIT,
	TOTAL_FILE_UPLOAD_LIMIT_LABEL
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/constants.ts';

const MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS = [
	'pdf',
	'doc',
	'docx',
	'ppt',
	'pptx',
	'xls',
	'xlsx',
	'msg',
	'jpg',
	'jpeg',
	'png',
	'tif',
	'tiff'
];
const MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES = [
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-outlook',
	'image/jpeg',
	'image/png',
	'image/tiff',
	'application/octet-stream'
];
const UNLIMITED_FILES = Number.MAX_SAFE_INTEGER;

const baseFileUploadConfig = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	maxFilesPerUpload: UNLIMITED_FILES,
	maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
	maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
	multiple: true
};

export const frontOfficeGateway2questions = {
	gateway2CoverLetter: {
		title: 'Gateway 2 covering letter',
		question: 'Upload your Gateway 2 covering letter',
		fieldName: 'gateway2CoverLetter',
		url: 'covering-letter',
		text: {
			caption: 'Procedural documents'
		}
	},
	localPlanTimetable: {
		title: 'Local plan timetable',
		question: 'Upload local plan timetable',
		fieldName: 'localPlanTimetable',
		url: 'local-plan-timetable',
		text: {
			caption: 'Procedural documents'
		}
	},
	projectInitiationDocument: {
		title: 'Project initiation document',
		question: 'Upload project initiation document',
		fieldName: 'projectInitiationDocument',
		url: 'project-initiation-document',
		text: {
			caption: 'Procedural documents'
		}
	},
	draftStatementOfCompliance: {
		title: 'Draft statement of compliance',
		question: 'Upload draft statement of compliance',
		fieldName: 'draftStatementOfCompliance',
		url: 'draft-stat-compliance',
		text: {
			caption: 'Procedural documents'
		}
	},
	noticeOfIntention: {
		title: 'Notice of intention to commence local plan preparation',
		question: 'Upload your notice of intention to commence local plan preparation',
		fieldName: 'noticeOfIntention',
		url: 'notice-of-intent',
		text: {
			caption: 'Consultation documents'
		}
	},
	gateway1SelfAssessment: {
		title: 'Gateway 1 - Self Assessment of Readiness',
		question: 'Upload your Gateway 1 - Self Assessment of Readiness',
		fieldName: 'gateway1SelfAssessment',
		url: 'g1-self-assess',
		text: {
			caption: 'Consultation documents'
		}
	},
	consultationOnProposedContent: {
		title: 'Consultation on proposed local plan content and evidence documents',
		question: 'Upload your Consultation on proposed local plan content and evidence documents',
		fieldName: 'consultationOnProposedContent',
		url: 'cons-of-proposed',
		text: {
			caption: 'Consultation documents'
		}
	},
	draftStatementOfSoundness: {
		title: 'Draft statement of soundness',
		question: 'Upload your draft statement of soundness',
		fieldName: 'draftStatementOfSoundness',
		url: 'draft-stat-soundness',
		text: {
			caption: 'Procedural documents'
		}
	},
	scopingConsultationDocuments: {
		title: 'Scoping consultation documents',
		question: 'Upload your scoping consultation documents',
		fieldName: 'scopingConsultationDocuments',
		url: 'scoping-cons',
		text: {
			caption: 'Consultation documents'
		}
	},
	consultationSummaryFeedbackScoping: {
		title: 'Consultation summary of feedback to scoping consultation',
		question: 'Upload consultation summary of feedback to scoping consultation documents',
		fieldName: 'consultationSummaryFeedbackScoping',
		url: 'cons-summ',
		text: {
			caption: 'Consultation documents'
		}
	},
	consultationSummaryProposedContent: {
		title: 'Summary of consultation on proposed local plan content and evidence documents',
		question: 'Upload your summary of consultation on proposed local plan content and evidence',
		fieldName: 'consultationSummaryProposedContent',
		url: 'summary-of-consultation',
		text: {
			caption: 'Consultation documents'
		}
	},
	subsequentWorkTowardsADraftPlan: {
		title: 'Subsequent work towards a draft Plan',
		question: 'Upload any subsequent work towards a draft plan',
		fieldName: 'subsequentWorkTowardsADraftPlan',
		url: 'subsequent-work-towards-a-draft-plan',
		text: {
			caption: 'Additional documents'
		}
	},
	planContent: {
		title: 'Plan content',
		question: 'Upload plan content documents',
		fieldName: 'planContent',
		url: 'plan-content',
		text: {
			caption: 'Plan content, evidence and background',
			bodyText:
				'You should add any documents that will form part of your local plan. These can be in draft form and could include:',
			bulletList: [
				'vision, aims, objectives, up to 10 outcomes',
				'spatial strategy options or spatial strategy',
				'other plan content'
			],
			bulletListFooter: 'The document name must describe what it is, for example "spatial strategy options 2026 draft".'
		}
	},
	evidenceAndProgress: {
		title: 'Evidence and progress',
		question: 'Upload evidence and progress',
		fieldName: 'evidenceAndProgress',
		url: 'evidence-and-progress',
		text: {
			caption: 'Plan content, evidence and background',
			bodyText:
				'You should add any documents that provide evidence to show the progress of your local plan. There is no need to add every document on this list, just those that are relevant to your local plan. These can be in draft form and could include:',
			bulletList: [
				'list of evidence documents with completion dates',
				'progress towards setting a housing requirement and evidence such as a housing needs assessment and strategic housing market assessment',
				'progress and evidence towards identifying needs for Traveller accommodation such as an accommodation assessment',
				'progress and evidence towards setting other development needs and supply (like employment or retail)',
				'progress on assessments required by the Habitats Regulations and the Environmental Assessment Regulations',
				'topic papers (up to 5 issues, max 2,000 words each)',
				'site selection approach and evidence',
				'green belt review',
				'evidence related to the matters of soundness to be discussed'
			],
			bulletListFooter: 'The document name must describe what it is, for example "green belt review 2026".'
		}
	},
	latestPoliciesMap: {
		title: 'Latest policies map',
		question: 'Upload your latest policies map',
		fieldName: 'latestPoliciesMap',
		url: 'latest-policies-map',
		text: {
			caption: 'Plan content, evidence and background'
		}
	}
};

const fileUploadText = {
	introduction: 'Drag and drop or choose files',
	fileRequirementsText:
		'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
	chooseFilesButtonText: 'Choose files',
	dropInstructionText: 'or drop files',
	continueButtonText: 'Save and return'
};

export const FRONT_OFFICE_GW2_QUESTIONS = Object.fromEntries(
	Object.entries(frontOfficeGateway2questions).map(([key, question]) => [
		key,
		{
			...baseFileUploadConfig,
			...question,
			text: {
				...fileUploadText,
				...question.text
			},
			validators: [new FileUploadRequiredValidator(question.fieldName, undefined, { requiredForJourney: false })]
		}
	])
);

export const FRONT_OFFICE_GW2_TEXT_QUESTIONS = {
	digitalSupportingMaterial: {
		type: 'single-line-input' as const,
		title: 'Digital supporting material',
		question: 'Add a link to your digital supporting material',
		fieldName: 'digitalSupportingMaterialLink',
		url: 'digital-supporting-material',
		label: 'Link',
		description:
			'Add a link to any digital or interactive supporting material that is published publicly online. Do not link to folders or repositories that are not publicly available.\n\nYou must still upload all requested documents separately, including your evidence base.',
		text: {
			caption: 'Plan content and evidence documents',
			continueButtonText: 'Save and return'
		},
		validators: []
	}
};
