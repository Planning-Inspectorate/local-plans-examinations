import { createQuestions, questionClasses, type Question } from '@planning-inspectorate/dynamic-forms';
import { CUSTOM_COMPONENT_CLASSES, CUSTOM_COMPONENTS } from '@pins/local-plans-lib/forms/custom-components/index.ts';
import { FileUploadRequiredValidator } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { WebsiteUrlValidator } from '@pins/local-plans-lib/forms/validators/website-url-validator.ts';
import {
	SINGLE_FILE_UPLOAD_LIMIT,
	SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	TOTAL_FILE_UPLOAD_LIMIT,
	TOTAL_FILE_UPLOAD_LIMIT_LABEL
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/constants.ts';
import { createDownloadDocumentSummaryFormatter as createFormatter } from '../utils.ts';

const allQuestionClasses = {
	...questionClasses,
	...CUSTOM_COMPONENT_CLASSES
};

const ALLOWED_EXTENSIONS = [
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
const ALLOWED_MIME_TYPES = [
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

export const CHECK_ANSWERS_REDIRECT_QUERY = 'checkAnswersRedirect';
export const CHECK_ANSWERS_REDIRECTS = {
	CHECK_YOUR_ANSWERS: 'check-your-answers',
	NEXT_QUESTION: 'next-question'
} as const;

export type CheckAnswersRedirect = (typeof CHECK_ANSWERS_REDIRECTS)[keyof typeof CHECK_ANSWERS_REDIRECTS];

const baseFileUploadConfig = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	allowedFileExtensions: ALLOWED_EXTENSIONS,
	allowedMimeTypes: ALLOWED_MIME_TYPES,
	maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	maxFilesPerUpload: UNLIMITED_FILES,
	maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
	maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
	multiple: true
};

const fileUploadText = {
	introduction: 'Upload a file',
	uploadLabel: 'Upload a file',
	fileRequirementsText:
		'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
	chooseFilesButtonText: 'Choose files',
	dropInstructionText: 'or drop files',
	continueButtonText: 'Save and return'
};

const PROCEDURAL_DOCUMENTS_CAPTION = 'Procedural documents';
const CONSULTATION_DOCUMENTS_CAPTION = 'Consultation documents';
const PLAN_CONTENT_CAPTION = 'Plan content, evidence and background';
const PLAN_CONTENT_AND_EVIDENCE_DOCUMENTS_CAPTION = 'Plan content and evidence documents';

const gateway3TextInputQuestions = {
	examinationWebsite: {
		title: 'Examination website',
		question: 'Add a link to your examination website',
		fieldName: 'examinationWebsite',
		url: 'examination-website',
		type: 'single-line-input' as const,
		hint: 'Enter the web address (URL) where your examination library is published',
		capitaliseAnswer: false,
		validators: [new WebsiteUrlValidator()],
		viewData: {
			pageCaption: PLAN_CONTENT_AND_EVIDENCE_DOCUMENTS_CAPTION
		},
		text: {
			caption: PLAN_CONTENT_AND_EVIDENCE_DOCUMENTS_CAPTION,
			continueButtonText: 'Save and return'
		}
	}
};

const gateway3FileUploadQuestions = {
	proposedLocalPlan: {
		title: 'Proposed local plan submission for examination',
		question: 'Upload your proposed local plan submission for examination',
		fieldName: 'proposedLocalPlan',
		url: 'proposed-local-plan',
		text: {
			caption: PLAN_CONTENT_CAPTION
		}
	},
	mapOfPolicies: {
		title: 'Map of proposed local plan policies',
		question: 'Upload your map of proposed local plan policies',
		fieldName: 'mapOfPolicies',
		url: 'map-of-policies',
		text: {
			caption: PLAN_CONTENT_CAPTION
		}
	},
	statementOfCompliance: {
		title: 'Statement of compliance',
		question: 'Upload your statement of compliance',
		fieldName: 'statementOfCompliance',
		url: 'statement-of-compliance',
		text: {
			caption: PROCEDURAL_DOCUMENTS_CAPTION
		}
	},
	statementOfSoundness: {
		title: 'Statement of soundness',
		question: 'Upload your statement of soundness',
		fieldName: 'statementOfSoundness',
		url: 'statement-of-soundness',
		text: {
			caption: PROCEDURAL_DOCUMENTS_CAPTION
		}
	},
	consultationEngagementSummary: {
		title: 'Summary of consultation and engagement activities in preparing the proposed local plan',
		question: 'Upload your summary of consultation and engagement activities in preparing the proposed local plan',
		fieldName: 'consultationEngagementSummary',
		url: 'consultation-engagement-summary',
		text: {
			caption: CONSULTATION_DOCUMENTS_CAPTION
		}
	},
	scopingConsultationSummary: {
		title: 'Summary of scoping consultation',
		question: 'Upload your summary of scoping consultation',
		fieldName: 'scopingConsultationSummary',
		url: 'scoping-consultation-summary',
		text: {
			caption: CONSULTATION_DOCUMENTS_CAPTION
		}
	},
	consultationContentEvidenceSummary: {
		title: 'Summary of consultation on proposed local plan content and evidence',
		question: 'Upload your summary of consultation on proposed local plan content and evidence',
		fieldName: 'consultationContentEvidenceSummary',
		url: 'consultation-content-evidence-summary',
		text: {
			caption: CONSULTATION_DOCUMENTS_CAPTION
		}
	},
	consultationProposedPlanSummary: {
		title: 'Summary of consultation on proposed local plan',
		question: 'Upload your summary of consultation on proposed local plan',
		fieldName: 'consultationProposedPlanSummary',
		url: 'consultation-proposed-plan-summary',
		text: {
			caption: PROCEDURAL_DOCUMENTS_CAPTION
		}
	},
	practicalArrangementsStatement: {
		title: 'Practical arrangements demonstrating readiness for examination',
		question: 'Upload your practical arrangements demonstrating readiness for examination',
		fieldName: 'practicalArrangementsStatement',
		url: 'practical-arrangements-statement',
		text: {
			caption: PLAN_CONTENT_CAPTION
		}
	}
};

const gateway3OptionalFileUploadQuestions = {
	copiesOfRepresentations: {
		title: 'Representations',
		question: 'Upload representations',
		fieldName: 'copiesOfRepresentations',
		url: 'copies-of-representations',
		text: {
			caption: CONSULTATION_DOCUMENTS_CAPTION
		}
	},
	supplementaryPlansStatement: {
		title: 'Supplementary plans statement',
		question: 'Upload your supplementary plans statement page',
		fieldName: 'supplementaryPlansStatement',
		url: 'supplementary-plans-statement',
		text: {
			caption: PLAN_CONTENT_CAPTION
		}
	},
	environmentalReport: {
		title: 'Environmental report',
		question: 'Upload your environmental report',
		fieldName: 'environmentalReport',
		url: 'environmental-report',
		text: {
			caption: PLAN_CONTENT_CAPTION
		}
	},
	statementOfReasonsDetermination: {
		title: 'Statement demonstrating that the proposed local plan is unlikely to have significant environmental effects',
		question:
			'Upload your statement demonstrating that the proposed local plan is unlikely to have significant environmental effects',
		fieldName: 'statementOfReasonsDetermination',
		url: 'statement-of-reasons-determination',
		text: {
			caption: PLAN_CONTENT_CAPTION
		}
	},
	representationsProgressSummary: {
		title: 'Summary of representations and responses on meeting prescribed requirements',
		question: 'Upload your summary of representations and responses on meeting prescribed requirements',
		fieldName: 'representationsProgressSummary',
		url: 'representations-progress-summary',
		text: {
			caption: CONSULTATION_DOCUMENTS_CAPTION
		}
	},
	gateway2IssuesSummary: {
		title: 'Summary of how Gateway 2 assessor issues have been addressed',
		question: 'Upload your summary of how Gateway 2 assessor issues have been addressed',
		fieldName: 'gateway2IssuesSummary',
		url: 'gateway-2-issues-summary',
		text: {
			caption: PROCEDURAL_DOCUMENTS_CAPTION
		}
	},
	changesSinceConsultationStatement: {
		title:
			'Statement explaining changes since the proposed local plan consultation, reasons for changes, any additional consultations',
		question:
			'Upload your statement explaining changes since the proposed local plan consultation, reasons for changes, any additional consultation',
		fieldName: 'changesSinceConsultationStatement',
		url: 'changes-since-consultation-statement',
		text: {
			caption: PROCEDURAL_DOCUMENTS_CAPTION
		}
	},
	otherDocuments: {
		title: 'Supporting material',
		question: 'Upload your supporting material',
		fieldName: 'otherDocuments',
		url: 'other-documents',
		text: {
			caption: PLAN_CONTENT_CAPTION
		}
	}
};

export const GW3_TEXT_INPUT_QUESTIONS = Object.fromEntries(
	Object.entries(gateway3TextInputQuestions).map(([key, questionDef]) => [
		key,
		{
			...questionDef,
			text: { ...questionDef.text }
		}
	])
);

function buildFileUploadQuestions(
	questions: Record<
		string,
		{ title: string; question: string; fieldName: string; url: string; text: { caption: string } }
	>,
	requiredForJourney: boolean
) {
	return Object.fromEntries(
		Object.entries(questions).map(([key, questionDef]) => [
			key,
			{
				...baseFileUploadConfig,
				...questionDef,
				text: {
					...fileUploadText,
					...questionDef.text
				},
				validators: [new FileUploadRequiredValidator(questionDef.fieldName, undefined, { requiredForJourney })]
			}
		])
	);
}

export const GW3_REQUIRED_FILE_UPLOAD_QUESTIONS = buildFileUploadQuestions(gateway3FileUploadQuestions, true);

export const GW3_OPTIONAL_FILE_UPLOAD_QUESTIONS = buildFileUploadQuestions(gateway3OptionalFileUploadQuestions, false);

export const GW3_FILE_UPLOAD_QUESTIONS = {
	...GW3_REQUIRED_FILE_UPLOAD_QUESTIONS,
	...GW3_OPTIONAL_FILE_UPLOAD_QUESTIONS
};

export const REQUIRED_GATEWAY_3_ITEM_TITLES = [
	gateway3TextInputQuestions.examinationWebsite.title,
	...Object.values(gateway3FileUploadQuestions).map((questionDefinition) => questionDefinition.title)
];

export const GW3QUESTIONS = {
	...GW3_TEXT_INPUT_QUESTIONS,
	...GW3_FILE_UPLOAD_QUESTIONS
};

export function createGateway3Questions(planReference: string | undefined) {
	const questionsForRequest = Object.fromEntries(
		Object.entries(GW3QUESTIONS).map(([key, questionObj]) => {
			if (key === 'examinationWebsite') {
				return [key, questionObj];
			}

			return [
				key,
				{
					...questionObj,
					formatSummaryValue: createDownloadDocumentSummaryFormatter(planReference)
				}
			];
		})
	);

	return createQuestions(
		questionsForRequest,
		allQuestionClasses,
		{},
		{
			notStartedText: 'Not added',
			answerActionText: 'Add',
			continueButtonText: 'Save and return'
		}
	) as Record<string, Question>;
}

export function createDownloadDocumentSummaryFormatter(planReference: string | undefined) {
	return createFormatter(planReference, 'gateway-3-submission');
}
