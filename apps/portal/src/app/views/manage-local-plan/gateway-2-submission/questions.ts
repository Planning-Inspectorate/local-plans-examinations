import { COMPONENT_TYPES, createQuestions, questionClasses } from '@planning-inspectorate/dynamic-forms';
import type { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';
import {
	CUSTOM_COMPONENT_CLASSES,
	CUSTOM_COMPONENTS,
	type CrownQuestionProps
} from '@pins/local-plans-lib/forms/custom-components/index.ts';
import {
	ALLOWED_EXTENSIONS,
	ALLOWED_MIME_TYPES,
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

export const CHECK_ANSWERS_REDIRECT_QUERY = 'checkAnswersRedirect';
export const CHECK_ANSWERS_REDIRECTS = {
	CHECK_YOUR_ANSWERS: 'check-your-answers',
	NEXT_QUESTION: 'next-question'
} as const;

export type CheckAnswersRedirect = (typeof CHECK_ANSWERS_REDIRECTS)[keyof typeof CHECK_ANSWERS_REDIRECTS];

export const gateway2CoverLetterQuestion: FileUploaderQuestionProps = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	title: 'Gateway 2 cover letter',
	question: 'Upload Gateway 2 cover letter',
	fieldName: 'gateway2CoverLetter',
	url: 'gateway-2-cover-letter',
	allowedFileExtensions: ALLOWED_EXTENSIONS,
	allowedMimeTypes: ALLOWED_MIME_TYPES,
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
		dropInstructionText: 'or drop files'
	}
};

const gateway2ApplicationQuestions: Record<string, CrownQuestionProps> = {
	//prodecural documents
	gateway2CoverLetter: gateway2CoverLetterQuestion,
	localPlanTimetable: {
		type: CUSTOM_COMPONENTS.FILE_UPLOADER,
		title: 'Local plan timetable',
		question: 'Upload your local plan timetable',
		fieldName: 'localPlanTimetable',
		url: 'local-plan-timetable',
		allowedFileExtensions: ALLOWED_EXTENSIONS,
		allowedMimeTypes: ALLOWED_MIME_TYPES,
		maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
		maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
		maxFilesPerUpload: 1,
		maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
		maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
		multiple: false,
		text: {
			caption: 'Procedural documents',
			fileRequirementsText:
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB.',
			totalUploadSizeText: 'The total size of your uploaded files must be smaller than 1GB.',
			chooseFilesButtonText: 'Choose files',
			dropInstructionText: 'or drop files'
		}
	},
	projectInitiation: {
		type: CUSTOM_COMPONENTS.FILE_UPLOADER,
		title: 'Project initiation document',
		question: 'Upload your Project Initiation document',
		fieldName: 'projectInitiationDocument',
		url: 'project-initiation-document',
		allowedFileExtensions: ALLOWED_EXTENSIONS,
		allowedMimeTypes: ALLOWED_MIME_TYPES,
		maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
		maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
		maxFilesPerUpload: 1,
		maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
		maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
		multiple: false,
		text: {
			caption: 'Procedural documents',
			fileRequirementsText:
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB.',
			totalUploadSizeText: 'The total size of your uploaded files must be smaller than 1GB.',
			chooseFilesButtonText: 'Choose files',
			dropInstructionText: 'or drop files'
		}
	},
	draftStatementOfCompliance: {
		type: CUSTOM_COMPONENTS.FILE_UPLOADER,
		title: 'Draft statement of compliance',
		question: 'Upload your draft Statement of Compliance',
		fieldName: 'draftStatementOfCompliance',
		url: 'draft-statement-of-compliance',
		allowedFileExtensions: ALLOWED_EXTENSIONS,
		allowedMimeTypes: ALLOWED_MIME_TYPES,
		maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
		maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
		maxFilesPerUpload: 1,
		maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
		maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
		multiple: false,
		text: {
			caption: 'Procedural documents',
			fileRequirementsText:
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB.',
			totalUploadSizeText: 'The total size of your uploaded files must be smaller than 1GB.',
			chooseFilesButtonText: 'Choose files',
			dropInstructionText: 'or drop files'
		}
	},
	draftStatementOfSoundness: {
		type: CUSTOM_COMPONENTS.FILE_UPLOADER,
		title: 'Draft statement of soundness',
		question: 'Upload your draft Statement of Soundness',
		fieldName: 'draftStatementOfSoundness',
		url: 'draft-statement-of-soundness',
		allowedFileExtensions: ALLOWED_EXTENSIONS,
		allowedMimeTypes: ALLOWED_MIME_TYPES,
		maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
		maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
		maxFilesPerUpload: 1,
		maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
		maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
		multiple: false,
		text: {
			caption: 'Procedural documents',
			fileRequirementsText:
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB.',
			totalUploadSizeText: 'The total size of your uploaded files must be smaller than 1GB.',
			chooseFilesButtonText: 'Choose files',
			dropInstructionText: 'or drop files'
		}
	},
	// consultation documents
	noticeOfIntentionToCommenceLocalPlanPreparation: {
		type: CUSTOM_COMPONENTS.FILE_UPLOADER,
		title: 'Notice of intention to commence local plan preparation',
		question: 'Upload your notice of intention to commence local plan preparation',
		fieldName: 'noticeOfIntentionToCommenceLocalPlanPreparation',
		url: 'notice-of-intention-to-commence-local-plan-preparation',
		allowedFileExtensions: ALLOWED_EXTENSIONS,
		allowedMimeTypes: ALLOWED_MIME_TYPES,
		maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
		maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
		maxFilesPerUpload: 1,
		maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
		maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
		multiple: false,
		text: {
			caption: 'Consultation documents',
			fileRequirementsText:
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB.',
			totalUploadSizeText: 'The total size of your uploaded files must be smaller than 1GB.',
			chooseFilesButtonText: 'Choose files',
			dropInstructionText: 'or drop files'
		}
	},
	scopingConsultationDocuments: {
		type: CUSTOM_COMPONENTS.FILE_UPLOADER,
		title: 'Scoping consultation documents',
		question: 'Upload your scoping consultation documents',
		fieldName: 'scopingConsultationDocuments',
		url: 'scoping-consultation-documents',
		allowedFileExtensions: ALLOWED_EXTENSIONS,
		allowedMimeTypes: ALLOWED_MIME_TYPES,
		maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
		maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
		maxFilesPerUpload: 1,
		maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
		maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
		multiple: false,
		text: {
			caption: 'Consultation documents',
			fileRequirementsText:
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB.',
			totalUploadSizeText: 'The total size of your uploaded files must be smaller than 1GB.',
			chooseFilesButtonText: 'Choose files',
			dropInstructionText: 'or drop files'
		}
	},
	consultationSummaryOfFeedbackToScopingConsultation: {
		type: CUSTOM_COMPONENTS.FILE_UPLOADER,
		title: 'Consultation summary of feedback to scoping consultation',
		question: 'Upload your consultation summary of feedback to scoping consultation',
		fieldName: 'consultationSummaryOfFeedbackToScopingConsultation',
		url: 'consultation-summary-of-feedback-to-scoping-consultation',
		allowedFileExtensions: ALLOWED_EXTENSIONS,
		allowedMimeTypes: ALLOWED_MIME_TYPES,
		maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
		maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
		maxFilesPerUpload: 1,
		maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
		maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
		multiple: false,
		text: {
			caption: 'Consultation documents',
			fileRequirementsText:
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB.',
			totalUploadSizeText: 'The total size of your uploaded files must be smaller than 1GB.',
			chooseFilesButtonText: 'Choose files',
			dropInstructionText: 'or drop files'
		}
	},
	gateway1SelfAssessmentOfReadiness: {
		type: CUSTOM_COMPONENTS.FILE_UPLOADER,
		title: 'Gateway 1 - Self assessment of readiness',
		question: 'Upload Gateway 1 - self assessment of readiness',
		fieldName: 'gateway1SelfAssessmentOfReadiness',
		url: 'gateway-1-self-assessment-of-readiness',
		allowedFileExtensions: ALLOWED_EXTENSIONS,
		allowedMimeTypes: ALLOWED_MIME_TYPES,
		maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
		maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
		maxFilesPerUpload: 1,
		maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
		maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
		multiple: false,
		text: {
			caption: 'Consultation documents',
			fileRequirementsText:
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB.',
			totalUploadSizeText: 'The total size of your uploaded files must be smaller than 1GB.',
			chooseFilesButtonText: 'Choose files',
			dropInstructionText: 'or drop files'
		}
	},
	consultationOnProposedLocalPlanContentAndEvidence: {
		type: CUSTOM_COMPONENTS.FILE_UPLOADER,
		title: 'Consultation on proposed local plan content and evidence documents',
		question: 'Upload your consultation on proposed local plan content and evidence documents',
		fieldName: 'consultationOnProposedLocalPlanContentAndEvidenceDocuments',
		url: 'consultation-on-proposed-local-plan-content-and-evidence-documents',
		allowedFileExtensions: ALLOWED_EXTENSIONS,
		allowedMimeTypes: ALLOWED_MIME_TYPES,
		maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
		maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
		maxFilesPerUpload: 1,
		maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
		maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
		multiple: false,
		text: {
			caption: 'Consultation documents',
			fileRequirementsText:
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB.',
			totalUploadSizeText: 'The total size of your uploaded files must be smaller than 1GB.',
			chooseFilesButtonText: 'Choose files',
			dropInstructionText: 'or drop files'
		}
	},
	summaryOfConsultationOnProposedLocalPlanContentAndEvidenceDocuments: {
		type: CUSTOM_COMPONENTS.FILE_UPLOADER,
		title: 'Summary of consultation on proposed local plan content and evidence documents',
		question: 'Upload your summary of consultation on proposed local plan content and evidence documents',
		fieldName: 'summaryOfConsultationOnProposedLocalPlanContentAndEvidenceDocuments',
		url: 'summary-of-consultation-on-proposed-loca-plan-content-and-evidence-documents',
		allowedFileExtensions: ALLOWED_EXTENSIONS,
		allowedMimeTypes: ALLOWED_MIME_TYPES,
		maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
		maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
		maxFilesPerUpload: 1,
		maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
		maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
		multiple: false,
		text: {
			caption: 'Consultation documents',
			fileRequirementsText:
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB.',
			totalUploadSizeText: 'The total size of your uploaded files must be smaller than 1GB.',
			chooseFilesButtonText: 'Choose files',
			dropInstructionText: 'or drop files'
		}
	},
	// Additional documents
	subsequentWorkTowardsADraftPlan: {
		type: CUSTOM_COMPONENTS.FILE_UPLOADER,
		title: 'Subsequent work towards a draft plan',
		question: 'Upload any subsequent work towards a draft plan',
		fieldName: 'subsequentWorkTowardsADraftPlan',
		url: 'subsequent-work-towards-a-draft-plan',
		allowedFileExtensions: ALLOWED_EXTENSIONS,
		allowedMimeTypes: ALLOWED_MIME_TYPES,
		maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
		maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
		maxFilesPerUpload: 1,
		maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
		maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
		multiple: false,
		text: {
			caption: 'Additional documents',
			introduction: 'This may include the following:',
			bulletList: [
				'Up to 5 issues of soundness topic papers (2,000 word limit per paper)',
				'Full list of evidence base documents (dates for completion)',
				'Draft vision, aims and objectives, 10 draft outcomes',
				'Latest version of a draft plan and/or policies map',
				'Spatial strategy options or draft spatial strategy',
				'Progress towards setting a housing requirement and associated evidence a such as a housing needs assessment and strategic housing market assessment',
				'Progress towards identifying needs for Traveller accommodation and associated evidence such as accommodation assessment',
				'Progress towards setting other development needs and supply (employment, retail etc)',
				'Site selection approach / evidence',
				'Draft Green Belt Review',
				'Evidence relevant to the matters of soundness to be discussed',
				'Evidence on engagement between plan making authorities and relevant bodies',
				'Progress on assessments required by the Habitats Regulations and the Environmental Assessment Regulations'
			],
			fileRequirementsText:
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB.',
			totalUploadSizeText: 'The total size of your uploaded files must be smaller than 1GB.',
			chooseFilesButtonText: 'Choose files',
			dropInstructionText: 'or drop files'
		}
	},
	// workshop preferences
	suggestedWorkshopVenue: {
		type: COMPONENT_TYPES.RADIO,
		options: [
			{ value: 'virtual', text: 'Virtual' },
			{
				value: 'in-person',
				text: 'In-person',
				conditional: {
					fieldName: 'in-person',
					question: 'Name the suggested venue',
					type: 'text'
				}
			},
			{ value: 'no-preference', text: 'No preference' }
		],
		question: 'Where would you like to hold the workshop?',
		fieldName: 'workshopLocation',
		url: 'workshop-location',
		title: 'Location'
	},
	suggestedWorkshopDates: {
		type: COMPONENT_TYPES.TEXT_ENTRY,
		title: 'Dates',
		question: 'Workshop dates',
		fieldName: 'workshopDates',
		url: 'workshop-dates'
	}
};

export const questions = createQuestions(
	gateway2ApplicationQuestions,
	allQuestionClasses,
	{},
	{
		answerActionText: 'Add'
	}
) as Record<string, Question>;

const checkAnswersRedirects: Partial<Record<keyof typeof gateway2ApplicationQuestions, CheckAnswersRedirect>> = {};

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
