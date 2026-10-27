import { createQuestions, questionClasses, type Question } from '@planning-inspectorate/dynamic-forms';
import { CUSTOM_COMPONENT_CLASSES, CUSTOM_COMPONENTS } from '@pins/local-plans-lib/forms/custom-components/index.ts';
import { WebsiteUrlValidator } from '@pins/local-plans-lib/forms/validators/website-url-validator.ts';
import {
	SINGLE_FILE_UPLOAD_LIMIT,
	SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	TOTAL_FILE_UPLOAD_LIMIT,
	TOTAL_FILE_UPLOAD_LIMIT_LABEL
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/constants.ts';
import { DOCUMENT_SET_FOLDER_NAME } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { FileUploadRequiredValidator } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';

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

const baseFileUploadConfig = {
	type: CUSTOM_COMPONENTS.FILE_UPLOADER,
	allowedFileExtensions: ALLOWED_EXTENSIONS,
	allowedMimeTypes: ALLOWED_MIME_TYPES,
	maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	maxFilesPerUpload: Number.MAX_SAFE_INTEGER,
	maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
	maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
	multiple: true
};

const fileUploadText = {
	introduction: 'Upload a file',
	fileRequirementsText:
		'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
	uploadLabel: 'Upload a file',
	chooseFilesButtonText: 'Choose files',
	dropInstructionText: 'or drop files',
	continueButtonText: 'Save and return'
};

const examinationWebsite = {
	title: 'Examination website',
	question: 'Confirm examination website',
	fieldName: 'examinationWebsiteUrl',
	url: 'examination-website',
	type: 'single-line-input' as const,
	capitaliseAnswer: false,
	validators: [new WebsiteUrlValidator()],
	viewData: {
		pageCaption: undefined
	}
};

const requiredFileUploadQuestions = {
	localPlanSubmission: {
		title: 'Local plan submission for examination',
		question: 'Upload local plan submission for examination',
		fieldName: 'localPlanSubmission',
		url: 'local-plan-submission',
		documentSetFolderName: DOCUMENT_SET_FOLDER_NAME.EX_LOCAL_PLAN
	},
	mapOfPolicies: {
		title: 'Map of proposed local plan policies',
		question: 'Upload map of proposed local plan policies',
		fieldName: 'mapOfPolicies',
		url: 'map-of-proposed-local-plan-policies',
		documentSetFolderName: DOCUMENT_SET_FOLDER_NAME.EX_MAP_OF_POLICIES
	},
	gateway3CompletionStatement: {
		title: 'Gateway 3 completion statement',
		question: 'Upload gateway 3 completion statement',
		fieldName: 'gateway3CompletionStatement',
		url: 'gateway-3-completion-statement',
		documentSetFolderName: DOCUMENT_SET_FOLDER_NAME.EX_G3_COMPLETION
	},
	consultationEngagementSummary: {
		title: 'Summary of consultation and engagement activities in preparing the proposed local plan',
		question: 'Upload summary of consultation and engagement activities in preparing the proposed local plan',
		fieldName: 'consultationEngagementSummary',
		url: 'consultation-engagement-activities',
		documentSetFolderName: DOCUMENT_SET_FOLDER_NAME.EX_CONSULTATION_ENGAGEMENT
	},
	consultationProposedPlanSummary: {
		title: 'Summary of consultation on proposed local plan',
		question: 'Upload summary of consultation on proposed local plan',
		fieldName: 'consultationProposedPlanSummary',
		url: 'consultation-on-proposed-local-plan',
		documentSetFolderName: DOCUMENT_SET_FOLDER_NAME.EX_CONSULTATION_PLAN
	},
	statementOfCompliance: {
		title: 'Statement of compliance',
		question: 'Upload statement of compliance',
		fieldName: 'statementOfCompliance',
		url: 'statement-of-compliance',
		documentSetFolderName: DOCUMENT_SET_FOLDER_NAME.EX_STATEMENT_COMPLIANCE
	},
	statementOfSoundness: {
		title: 'Statement of soundness',
		question: 'Upload statement of soundness',
		fieldName: 'statementOfSoundness',
		url: 'statement-of-soundness',
		documentSetFolderName: DOCUMENT_SET_FOLDER_NAME.EX_STATEMENT_SOUNDNESS
	}
};

const optionalFileUploadQuestions = {
	spatialStrategyRepresentations: {
		title: 'Representations on conformity with an operative spatial development strategy',
		question: 'Upload representations on conformity with an operative spatial development strategy',
		fieldName: 'spatialStrategyRepresentations',
		url: 'spatial-development-strategy-representations',
		documentSetFolderName: DOCUMENT_SET_FOLDER_NAME.EX_SPATIAL_STRATEGY_REPS
	},
	environmentalReport: {
		title: 'Environmental report',
		question: 'Upload environmental report',
		fieldName: 'environmentalReport',
		url: 'environmental-report',
		documentSetFolderName: DOCUMENT_SET_FOLDER_NAME.EX_ENVIRONMENTAL_REPORT
	},
	environmentalEffectsStatement: {
		title: 'Statement demonstrating that the proposed local plan is unlikely to have significant environmental effects',
		question:
			'Upload statement demonstrating that the proposed local plan is unlikely to have significant environmental effects',
		fieldName: 'environmentalEffectsStatement',
		url: 'unlikely-significant-environmental-effects',
		documentSetFolderName: DOCUMENT_SET_FOLDER_NAME.EX_ENVIRONMENTAL_EFFECTS
	},
	additionalEvidenceDocuments: {
		title: 'Additional evidence documents',
		question: 'Upload additional environmental documents',
		fieldName: 'additionalEvidenceDocuments',
		url: 'additional-evidence-documents',
		documentSetFolderName: DOCUMENT_SET_FOLDER_NAME.EX_ADDITIONAL_EVIDENCE
	},
	changesSinceGateway3Statement: {
		title: 'Statement explaining changes made since Gateway 3 assessment and details of any additional consultations',
		question:
			'Upload statement explaining changes made since Gateway 3 assessment and details of any additional consultations',
		fieldName: 'changesSinceGateway3Statement',
		url: 'changes-since-gateway-3',
		documentSetFolderName: DOCUMENT_SET_FOLDER_NAME.EX_CHANGES_SINCE_G3
	},
	gateway3ReportRepresentations: {
		title: 'Representations required in the Gateway 3 report',
		question: 'Upload representations required in Gateway 3 report',
		fieldName: 'gateway3ReportRepresentations',
		url: 'gateway-3-report-representations',
		documentSetFolderName: DOCUMENT_SET_FOLDER_NAME.EX_G3_REPORT_REPS
	}
};

function buildFileUploadQuestions(
	questions: Record<
		string,
		{
			title: string;
			question: string;
			fieldName: string;
			url: string;
			documentSetFolderName: string;
		}
	>,
	requiredForJourney: boolean
) {
	return Object.fromEntries(
		Object.entries(questions).map(([key, questionDefinition]) => [
			key,
			{
				...baseFileUploadConfig,
				...questionDefinition,
				text: fileUploadText,
				validators: [new FileUploadRequiredValidator(questionDefinition.fieldName, undefined, { requiredForJourney })]
			}
		])
	);
}

export const EXAMINATION_REQUIRED_FILE_UPLOAD_QUESTIONS = buildFileUploadQuestions(requiredFileUploadQuestions, true);
export const EXAMINATION_OPTIONAL_FILE_UPLOAD_QUESTIONS = buildFileUploadQuestions(optionalFileUploadQuestions, false);
export const EXAMINATION_FILE_UPLOAD_QUESTIONS = {
	...EXAMINATION_REQUIRED_FILE_UPLOAD_QUESTIONS,
	...EXAMINATION_OPTIONAL_FILE_UPLOAD_QUESTIONS
};

export const EXAMINATION_QUESTIONS = {
	examinationWebsite,
	...EXAMINATION_FILE_UPLOAD_QUESTIONS
};

export const REQUIRED_EXAMINATION_ITEM_TITLES = [
	examinationWebsite.title,
	...Object.values(requiredFileUploadQuestions).map((questionDefinition) => questionDefinition.title)
];

export function createExaminationQuestions(planReference: string | undefined) {
	const questionsForRequest = Object.fromEntries(
		Object.entries(EXAMINATION_QUESTIONS).map(([key, questionDefinition]) => {
			if (key === 'examinationWebsite') {
				return [key, questionDefinition];
			}

			return [
				key,
				{
					...questionDefinition,
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
	const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;
	return ({ formattedAnswer, answer }: { formattedAnswer: string; answer: UploadedDocumentAnswer[] }) => {
		if (!encodedPlanReference || !Array.isArray(answer) || answer.length === 0) {
			return formattedAnswer;
		}

		const linkedFiles = answer.map((file) => {
			const documentGuid = file.metadata?.documentGuid;
			if (typeof documentGuid !== 'string' || !documentGuid) {
				return undefined;
			}
			const fileName = typeof file.fileName === 'string' ? decodeFileName(file.fileName) : formattedAnswer;
			return `<a href="/manage-local-plans/${encodedPlanReference}/examination/download-document/${encodeURIComponent(
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

type UploadedDocumentAnswer = {
	fileName?: string;
	metadata?: {
		documentGuid?: string;
	};
};

function decodeFileName(fileName: string) {
	try {
		return decodeURIComponent(fileName);
	} catch {
		return fileName;
	}
}
