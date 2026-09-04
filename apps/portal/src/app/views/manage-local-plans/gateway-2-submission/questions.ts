import { createQuestions, questionClasses, type Question } from '@planning-inspectorate/dynamic-forms';
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

const fileUploadText = {
	introduction: 'Drag and drop or choose files',
	fileRequirementsText:
		'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
	chooseFilesButtonText: 'Choose files',
	dropInstructionText: 'or drop files',
	continueButtonText: 'Save and return'
};

const gateway2questions = {
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
		title: 'Summary of consultation for proposed local plan content and evidence',
		question: 'Upload your summary of consultation for proposed local plan content and evidence',
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
	}
};

export const GW2QUESTIONS = Object.fromEntries(
	Object.entries(gateway2questions).map(([key, question]) => [
		key,
		{
			...baseFileUploadConfig,
			...question,
			text: {
				...fileUploadText,
				...question.text
			}
		}
	])
);

export function createGateway2Questions(planReference: string | undefined) {
	const questionsForRequest = Object.fromEntries(
		Object.entries(GW2QUESTIONS).map(([key, question]) => [
			key,
			{
				...question,
				formatSummaryValue: createDownloadDocumentSummaryFormatter(planReference)
			}
		])
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

function createDownloadDocumentSummaryFormatter(planReference: string | undefined) {
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

			return `<a href="/manage-local-plans/${encodedPlanReference}/gateway-2-submission/download-document/${encodeURIComponent(
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

function decodeFileName(fileName: string) {
	try {
		return decodeURIComponent(fileName);
	} catch {
		return fileName;
	}
}
