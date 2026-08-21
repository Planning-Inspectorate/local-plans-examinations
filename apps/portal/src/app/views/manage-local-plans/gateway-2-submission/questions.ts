import { createQuestions, questionClasses, type Question } from '@planning-inspectorate/dynamic-forms';
import {
	CUSTOM_COMPONENT_CLASSES,
	CUSTOM_COMPONENTS,
	type CrownQuestionProps
} from '@pins/local-plans-lib/forms/custom-components/index.ts';
import {
	SINGLE_FILE_UPLOAD_LIMIT,
	SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	TOTAL_FILE_UPLOAD_LIMIT,
	TOTAL_FILE_UPLOAD_LIMIT_LABEL
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/constants.ts';
import { type FileUploaderQuestionProps } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';

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

export const gateway2CoverLetterQuestion: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Gateway 2 covering letter',
	question: 'Upload your Gateway 2 covering letter',
	fieldName: 'gateway2CoverLetter',
	url: 'covering-letter',
	allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	maxFilesPerUpload: UNLIMITED_FILES,
	maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
	maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
	multiple: true,
	text: {
		caption: 'Procedural documents',
		introduction: 'Drag and drop or choose files',
		fileRequirementsText:
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
		chooseFilesButtonText: 'Choose files',
		dropInstructionText: 'or drop files',
		continueButtonText: 'Save and return'
	},
	validators: []
};

export const localPlanTimetableQuestion: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Local plan timetable',
	question: 'Upload local plan timetable',
	fieldName: 'localPlanTimetable',
	url: 'local-plan-timetable',
	allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
	maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
	multiple: true,
	text: {
		caption: 'Procedural documents',
		introduction: 'Drag and drop or choose files',
		fileRequirementsText:
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
		chooseFilesButtonText: 'Choose files',
		dropInstructionText: 'or drop files',
		continueButtonText: 'Save and return'
	},
	validators: []
};

export const projectInitiationDocumentQuestion: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Project initiation document',
	question: 'Upload your project initiation document',
	fieldName: 'projectInitiationDocument',
	url: 'project-initiation-document',
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

export const gateway2FileUploadQuestions = {
	gateway2CoverLetter: gateway2CoverLetterQuestion,
	localPlanTimetable: localPlanTimetableQuestion,
	projectInitiationDocument: projectInitiationDocumentQuestion
} satisfies Record<string, CrownQuestionProps>;

export const questions = createQuestions(
	gateway2FileUploadQuestions,
	allQuestionClasses,
	{},
	{
		notStartedText: 'Not added',
		answerActionText: 'Add'
	}
) as Record<string, Question>;

const checkAnswersRedirects: Partial<Record<keyof typeof gateway2FileUploadQuestions, CheckAnswersRedirect>> = {};

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
