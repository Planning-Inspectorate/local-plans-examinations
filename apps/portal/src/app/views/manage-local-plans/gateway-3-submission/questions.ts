import { createQuestions, questionClasses, type Question, StringValidator } from '@planning-inspectorate/dynamic-forms';
import { CUSTOM_COMPONENT_CLASSES, CUSTOM_COMPONENTS } from '@pins/local-plans-lib/forms/custom-components/index.ts';
import {
	SINGLE_FILE_UPLOAD_LIMIT,
	SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	TOTAL_FILE_UPLOAD_LIMIT,
	TOTAL_FILE_UPLOAD_LIMIT_LABEL
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/constants.ts';

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
	introduction: 'Drag and drop or choose files',
	fileRequirementsText:
		'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
	chooseFilesButtonText: 'Choose files',
	dropInstructionText: 'or drop files',
	continueButtonText: 'Save and return'
};

const REQUIRED_INFO_CAPTION = 'Required information';
const OPTIONAL_DOCS_CAPTION = 'Optional documents';

const gateway3TextInputQuestions = {
	examinationWebsite: {
		title: 'Examination website',
		question: 'Add a link to your examination website',
		fieldName: 'examinationWebsite',
		url: 'examination-website',
		type: 'single-line-input' as const,
		hint: 'Enter the web address (URL) where your examination library is published',
		validators: [
			new StringValidator({
				regex: {
					regex: '^https?://.+',
					regexMessage: 'Enter a valid link to your examination website'
				}
			})
		],
		text: {
			caption: REQUIRED_INFO_CAPTION,
			continueButtonText: 'Save and return'
		}
	}
};

const gateway3FileUploadQuestions = {
	proposedLocalPlan: {
		title: 'Proposed local plan intended for submission for examination',
		question: 'Upload your proposed local plan',
		fieldName: 'proposedLocalPlan',
		url: 'proposed-local-plan',
		text: {
			caption: REQUIRED_INFO_CAPTION
		}
	},
	mapOfPolicies: {
		title: 'Map of proposed local plan policies',
		question: 'Upload map of proposed local plan policies',
		fieldName: 'mapOfPolicies',
		url: 'map-of-policies',
		text: {
			caption: REQUIRED_INFO_CAPTION
		}
	},
	statementOfCompliance: {
		title: 'Statement of Compliance',
		question: 'Upload your Statement of Compliance',
		fieldName: 'statementOfCompliance',
		url: 'statement-of-compliance',
		text: {
			caption: REQUIRED_INFO_CAPTION
		}
	},
	statementOfSoundness: {
		title: 'Statement of Soundness',
		question: 'Upload your Statement of Soundness',
		fieldName: 'statementOfSoundness',
		url: 'statement-of-soundness',
		text: {
			caption: REQUIRED_INFO_CAPTION
		}
	},
	consultationEngagementSummary: {
		title: 'Summary of consultation and engagement activities undertaken in preparing the proposed local plan',
		question: 'Upload summary of consultation and engagement activities',
		fieldName: 'consultationEngagementSummary',
		url: 'consultation-engagement-summary',
		text: {
			caption: REQUIRED_INFO_CAPTION
		}
	},
	scopingConsultationSummary: {
		title: 'Summary of scoping consultation',
		question: 'Upload summary of scoping consultation',
		fieldName: 'scopingConsultationSummary',
		url: 'scoping-consultation-summary',
		text: {
			caption: REQUIRED_INFO_CAPTION
		}
	},
	consultationContentEvidenceSummary: {
		title: 'Summary of consultation on proposed local plan content and evidence',
		question: 'Upload summary of consultation on proposed local plan content and evidence',
		fieldName: 'consultationContentEvidenceSummary',
		url: 'consultation-content-evidence-summary',
		text: {
			caption: REQUIRED_INFO_CAPTION
		}
	},
	consultationProposedPlanSummary: {
		title: 'Summary of consultation on proposed local plan',
		question: 'Upload summary of consultation on proposed local plan',
		fieldName: 'consultationProposedPlanSummary',
		url: 'consultation-proposed-plan-summary',
		text: {
			caption: REQUIRED_INFO_CAPTION
		}
	},
	practicalArrangementsStatement: {
		title: 'Statement setting out practical arrangements demonstrating readiness for examination',
		question: 'Upload your statement of practical arrangements demonstrating readiness for examination',
		fieldName: 'practicalArrangementsStatement',
		url: 'practical-arrangements-statement',
		text: {
			caption: REQUIRED_INFO_CAPTION
		}
	}
};

const gateway3OptionalFileUploadQuestions = {
	copiesOfRepresentations: {
		title: 'Copies of representations',
		question: 'Upload copies of representations',
		fieldName: 'copiesOfRepresentations',
		url: 'copies-of-representations',
		text: {
			caption: OPTIONAL_DOCS_CAPTION
		}
	},
	supplementaryPlansStatement: {
		title: 'Supplementary plans statement',
		question: 'Upload your supplementary plans statement',
		fieldName: 'supplementaryPlansStatement',
		url: 'supplementary-plans-statement',
		text: {
			caption: OPTIONAL_DOCS_CAPTION
		}
	},
	environmentalReport: {
		title: 'Environmental report',
		question: 'Upload your environmental report',
		fieldName: 'environmentalReport',
		url: 'environmental-report',
		text: {
			caption: OPTIONAL_DOCS_CAPTION
		}
	},
	statementOfReasonsDetermination: {
		title:
			'Statement of reasons for a determination that the proposed local plan is unlikely to have significant environmental effects',
		question:
			'Upload statement of reasons for a determination that the proposed local plan is unlikely to have significant environmental effects',
		fieldName: 'statementOfReasonsDetermination',
		url: 'statement-of-reasons-determination',
		text: {
			caption: OPTIONAL_DOCS_CAPTION
		}
	},
	representationsProgressSummary: {
		title:
			'Summary of representations relating to progress towards meeting prescribed requirements and the LPA response',
		question:
			'Upload summary of representations relating to progress towards meeting prescribed requirements and the LPA response',
		fieldName: 'representationsProgressSummary',
		url: 'representations-progress-summary',
		text: {
			caption: OPTIONAL_DOCS_CAPTION
		}
	},
	gateway2IssuesSummary: {
		title: 'Summary of how Gateway 2 assessor issues have been addressed',
		question: 'Upload summary of how Gateway 2 assessor issues have been addressed',
		fieldName: 'gateway2IssuesSummary',
		url: 'gateway-2-issues-summary',
		text: {
			caption: OPTIONAL_DOCS_CAPTION
		}
	},
	changesSinceConsultationStatement: {
		title:
			'Statement explaining changes since the proposed local plan consultation, reasons for those changes, and any additional consultation',
		question:
			'Upload statement explaining changes since the proposed local plan consultation, reasons for those changes, and any additional consultation',
		fieldName: 'changesSinceConsultationStatement',
		url: 'changes-since-consultation-statement',
		text: {
			caption: OPTIONAL_DOCS_CAPTION
		}
	},
	otherDocuments: {
		title: 'Other documents',
		question: 'Upload other documents',
		fieldName: 'otherDocuments',
		url: 'other-documents',
		text: {
			caption: OPTIONAL_DOCS_CAPTION
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
	>
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
				}
			}
		])
	);
}

export const GW3_REQUIRED_FILE_UPLOAD_QUESTIONS = buildFileUploadQuestions(gateway3FileUploadQuestions);

export const GW3_OPTIONAL_FILE_UPLOAD_QUESTIONS = buildFileUploadQuestions(gateway3OptionalFileUploadQuestions);

export const GW3_FILE_UPLOAD_QUESTIONS = {
	...GW3_REQUIRED_FILE_UPLOAD_QUESTIONS,
	...GW3_OPTIONAL_FILE_UPLOAD_QUESTIONS
};

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
			answerActionText: 'Add'
		}
	) as Record<string, Question>;
}

export function createDownloadDocumentSummaryFormatter(planReference: string | undefined) {
	const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;
	return ({
		formattedAnswer,
		answer
	}: {
		formattedAnswer: string;
		answer: {
			fileName?: string;
			metadata?: {
				documentGuid?: string;
			};
		}[];
	}) => {
		if (!encodedPlanReference || !Array.isArray(answer) || answer.length === 0) {
			return formattedAnswer;
		}

		const linkedFiles = answer.map((file) => {
			const documentGuid = file.metadata?.documentGuid;

			if (typeof documentGuid !== 'string' || !documentGuid) {
				return undefined;
			}

			const fileName = typeof file.fileName === 'string' ? decodeFileName(file.fileName) : formattedAnswer;

			return `<a href="/manage-local-plans/${encodedPlanReference}/gateway-3-submission/download-document/${encodeURIComponent(
				documentGuid
			)}">${fileName}</a>`;
		});

		if (linkedFiles.some((file) => file === undefined)) {
			return formattedAnswer;
		}

		if (linkedFiles.length === 1) {
			return linkedFiles[0];
		}

		return `<ul class="govuk-list govuk-list--bullet">${linkedFiles.map((file) => `<li>${file}</li>`).join('')}</ul>`;
	};
}

export function decodeFileName(fileName: string) {
	try {
		return decodeURIComponent(fileName);
	} catch {
		return fileName;
	}
}
