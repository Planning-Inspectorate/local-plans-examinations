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
import { createFileUploadQuestion } from './utils.ts';

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
	question: 'Upload project initiation document',
	fieldName: 'projectInitiationDocument',
	url: 'project-initiation-document',
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

export const draftStatementOfComplianceQuestion: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Draft statement of compliance',
	question: 'Upload draft statement of compliance',
	fieldName: 'draftStatementOfCompliance',
	url: 'draft-stat-compliance',
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

export const noticeOfIntentionQuestion: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Notice of intention to commence local plan preparation',
	question: 'Upload your notice of intention to commence local plan preparation',
	fieldName: 'noticeOfIntention',
	url: 'notice-of-intent',
	allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	maxFilesPerUpload: UNLIMITED_FILES,
	maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
	maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
	multiple: true,
	text: {
		caption: 'Consultation documents',
		introduction: 'Drag and drop or choose files',
		fileRequirementsText:
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
		chooseFilesButtonText: 'Choose files',
		dropInstructionText: 'or drop files',
		continueButtonText: 'Save and return'
	},
	validators: []
};

export const gateway1SelfAssessmentQuestion: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Gateway 1 - Self Assessment of Readiness',
	question: 'Upload your Gateway 1 - Self Assessment of Readiness',
	fieldName: 'gateway1SelfAssessment',
	url: 'g1-self-assess',
	allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	text: {
		caption: 'Consultation documents',
		introduction: 'Drag and drop or choose files',
		fileRequirementsText:
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.'
	}
});

export const consultationOnProposedContentQuestion: FileUploaderQuestionProps = createFileUploadQuestion({
	title: 'Consultation on proposed local plan content and evidence documents',
	question: 'Upload your Consultation on proposed local plan content and evidence documents',
	fieldName: 'consultationOnProposedContent',
	url: 'cons-of-proposed',
	allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	text: {
		caption: 'Consultation documents',
		introduction: 'Drag and drop or choose files',
		fileRequirementsText:
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.'
	}
});

export const draftStatementOfSoundnessQuestion: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Draft statement of soundness',
	question: 'Upload your draft statement of soundness',
	fieldName: 'draftStatementOfSoundness',
	url: 'draft-stat-soundness',
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

export const scopingConsultationDocumentsQuestion: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Scoping consultation documents',
	question: 'Upload your scoping consultation documents',
	fieldName: 'scopingConsultationDocuments',
	url: 'scoping-cons',
	allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	maxFilesPerUpload: UNLIMITED_FILES,
	maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
	maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
	multiple: true,
	text: {
		caption: 'Consultation documents',
		introduction: 'Drag and drop or choose files',
		fileRequirementsText:
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
		chooseFilesButtonText: 'Choose files',
		dropInstructionText: 'or drop files',
		continueButtonText: 'Save and return'
	},
	validators: []
};

export const consultationSummaryFeedbackScopingQuestion: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Consultation summary of feedback to scoping consultation',
	question: 'Upload consultation summary of feedback to scoping consultation documents',
	fieldName: 'consultationSummaryFeedbackScoping',
	url: 'cons-summ',
	allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	maxFilesPerUpload: UNLIMITED_FILES,
	maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
	maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
	multiple: true,
	text: {
		caption: 'Consultation documents',
		introduction: 'Drag and drop or choose files',
		fileRequirementsText:
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
		chooseFilesButtonText: 'Choose files',
		dropInstructionText: 'or drop files',
		continueButtonText: 'Save and return'
	},
	validators: []
};

export const consultationSummaryProposedContentQuestion: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Summary of consultation for proposed local plan content and evidence',
	question: 'Upload your summary of consultation for proposed local plan content and evidence',
	fieldName: 'consultationSummaryProposedContent',
	url: 'summary-of-consultation',
	allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	maxFilesPerUpload: UNLIMITED_FILES,
	maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
	maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
	multiple: true,
	text: {
		caption: 'Consultation documents',
		introduction: 'Drag and drop or choose files',
		fileRequirementsText:
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
		chooseFilesButtonText: 'Choose files',
		dropInstructionText: 'or drop files',
		continueButtonText: 'Save and return'
	},
	validators: []
};

export const subsequentWorkTowardsADraftPlan: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Subsequent work towards a draft Plan',
	question: 'Upload any subsequent work towards a draft plan',
	fieldName: 'subsequentWorkTowardsADraftPlan',
	url: 'subsequent-work-towards-a-draft-plan',
	allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	maxFilesPerUpload: UNLIMITED_FILES,
	maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
	maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
	multiple: true,
	text: {
		caption: 'Additional documents',
		introduction: 'Drag and drop or choose files',
		fileRequirementsText:
			'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
		chooseFilesButtonText: 'Choose files',
		dropInstructionText: 'or drop files',
		continueButtonText: 'Save and return'
	},
	validators: []
};

export const gateway2FileUploadQuestions = {
	gateway2CoverLetter: gateway2CoverLetterQuestion,
	localPlanTimetable: localPlanTimetableQuestion,
	projectInitiationDocument: projectInitiationDocumentQuestion,
	draftStatementOfCompliance: draftStatementOfComplianceQuestion,
	noticeOfIntention: noticeOfIntentionQuestion,
	gateway1SelfAssessment: gateway1SelfAssessmentQuestion,
	consultationOnProposedContent: consultationOnProposedContentQuestion,
	draftStatementOfSoundness: draftStatementOfSoundnessQuestion,
	scopingConsultationDocuments: scopingConsultationDocumentsQuestion,
	consultationSummaryFeedbackScoping: consultationSummaryFeedbackScopingQuestion,
	consultationSummaryProposedContent: consultationSummaryProposedContentQuestion,
	subsequentWorkTowardsADraftPlan: subsequentWorkTowardsADraftPlan
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
export function appendQueryParam(url: string, key: string, value: string) {
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}
