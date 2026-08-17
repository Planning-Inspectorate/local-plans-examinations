import { createQuestions, questionClasses, type Question } from '@planning-inspectorate/dynamic-forms';
import {
	CUSTOM_COMPONENT_CLASSES,
	CUSTOM_COMPONENTS,
	type CrownQuestionProps
} from '@pins/local-plans-lib/forms/custom-components/index.ts';
import {
	type FileUploaderQuestionProps,
	SINGLE_FILE_UPLOAD_LIMIT,
	TOTAL_FILE_UPLOAD_LIMIT
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import {
	SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	TOTAL_FILE_UPLOAD_LIMIT_LABEL
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/constants.ts';

const allQuestionClasses = {
	...questionClasses,
	...CUSTOM_COMPONENT_CLASSES
};

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
const MINIMAL_PROCEDURAL_FILE_UPLOAD_LIMIT = 25 * 1024 * 1024;
const MINIMAL_PROCEDURAL_FILE_UPLOAD_LIMIT_LABEL = '25MB';
const MINIMAL_PROCEDURAL_UPLOAD_TEXT = {
	caption: 'Procedural documents',
	introduction: 'Upload a file',
	fileRequirementsText:
		'The file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and be smaller than 25MB',
	chooseFilesButtonText: 'Choose files',
	dropInstructionText: 'or drop files',
	continueButtonText: 'Save and return'
};
const UNLIMITED_FILES = Number.MAX_SAFE_INTEGER;

export const CHECK_ANSWERS_REDIRECT_QUERY = 'checkAnswersRedirect';
export const CHECK_ANSWERS_REDIRECTS = {
	CHECK_YOUR_ANSWERS: 'check-your-answers',
	NEXT_QUESTION: 'next-question'
} as const;

export type CheckAnswersRedirect = (typeof CHECK_ANSWERS_REDIRECTS)[keyof typeof CHECK_ANSWERS_REDIRECTS];

export const gateway3CoverLetterQuestion: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Gateway 3 cover letter',
	question: 'Upload Gateway 3 cover letter',
	fieldName: 'gateway3CoverLetter',
	url: 'gateway-3-cover-letter',
	allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	maxFilesPerUpload: 1,
	maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
	maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
	multiple: false,
	text: {
		caption: 'Procedural documents',
		introduction: 'Your cover letter should set out:',
		bulletList: [
			'a summary of where you are in preparing the plan, including what additional activities have been undertaken since the consultation on the proposed local plan content and evidence',
			'a description of up to 5 main soundness issues which you are seeking advice on',
			'any issues from the consultation on your proposed local plan content and evidence you want to highlight to the gateway assessor, if relevant and not already covered in other submitted documents'
		],
		fileRequirementsText:
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB.',
		totalUploadSizeText: 'The total size of your uploaded files must be smaller than 1GB.',
		chooseFilesButtonText: 'Choose files',
		dropInstructionText: 'or drop files',
		continueButtonText: 'Save and return'
	},
	validators: []
};

export const gateway3LocalPlanTimetableQuestion: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Gateway 3 local plan timetable',
	question: 'Upload your local plan timetable',
	fieldName: 'gateway3LocalPlanTimetable',
	url: 'gateway-3-local-plan-timetable',
	allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	maxFileSizeBytes: MINIMAL_PROCEDURAL_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel: MINIMAL_PROCEDURAL_FILE_UPLOAD_LIMIT_LABEL,
	maxFilesPerUpload: 3,
	maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
	maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
	multiple: true,
	text: MINIMAL_PROCEDURAL_UPLOAD_TEXT,
	validators: []
};

export const gateway3ProjectInitiationDocumentQuestion: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Gateway 3 project initiation document',
	question: 'Upload your project initiation document',
	fieldName: 'gateway3ProjectInitiationDocument',
	url: 'gateway-3-project-initiation-document',
	allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	maxFileSizeBytes: MINIMAL_PROCEDURAL_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel: MINIMAL_PROCEDURAL_FILE_UPLOAD_LIMIT_LABEL,
	maxFilesPerUpload: UNLIMITED_FILES,
	maxTotalUploadSizeBytes: Number.MAX_SAFE_INTEGER,
	maxTotalUploadSizeLabel: 'unlimited',
	multiple: true,
	text: MINIMAL_PROCEDURAL_UPLOAD_TEXT,
	validators: []
};

export const gateway3FileUploadQuestions = {
	gateway3CoverLetter: gateway3CoverLetterQuestion,
	gateway3LocalPlanTimetable: gateway3LocalPlanTimetableQuestion,
	gateway3ProjectInitiationDocument: gateway3ProjectInitiationDocumentQuestion
} satisfies Record<string, CrownQuestionProps>;

export const questions = createQuestions(
	gateway3FileUploadQuestions,
	allQuestionClasses,
	{},
	{
		notStartedText: 'Not added',
		answerActionText: 'Add'
	}
) as Record<string, Question>;

const checkAnswersRedirects: Partial<Record<keyof typeof gateway3FileUploadQuestions, CheckAnswersRedirect>> = {};

// Adds check answers redirect behaviour to configured questions.
for (const [questionName, redirect] of Object.entries(checkAnswersRedirects)) {
	if (!redirect) {
		continue;
	}

	addCheckAnswersRedirectToAction(questions[questionName], redirect);
}

// Updates a question action so it includes the check answers redirect query.
function addCheckAnswersRedirectToAction(question: Question, redirect: CheckAnswersRedirect) {
	const getAction = question.getAction.bind(question);

	question.getAction = (...params: Parameters<Question['getAction']>): ReturnType<Question['getAction']> => {
		const action = getAction(...params);
		if (!action || Array.isArray(action)) {
			return action;
		}

		return {
			...action,
			href: appendQueryParam(action.href, CHECK_ANSWERS_REDIRECT_QUERY, redirect)
		};
	};
}

// Appends a query parameter to a URL.
// Example format: /plan-title?checkAnswersRedirect=check-your-answers.
function appendQueryParam(url: string, key: string, value: string) {
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}
