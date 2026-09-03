import type { Request } from 'express';
import { CUSTOM_COMPONENTS } from '@pins/local-plans-lib/forms/custom-components/index.ts';
import {
	SINGLE_FILE_UPLOAD_LIMIT,
	SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	TOTAL_FILE_UPLOAD_LIMIT,
	TOTAL_FILE_UPLOAD_LIMIT_LABEL
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/constants.ts';
import type { FileUploaderQuestionProps } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';

export const MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS = [
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
export const MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES = [
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
export const UNLIMITED_FILES = Number.MAX_SAFE_INTEGER;

const DEFAULT_FILE_REQUIREMENTS_TEXT =
	'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.';
const DEFAULT_FILE_UPLOAD_TEXT = {
	introduction: 'Drag and drop or choose files',
	fileRequirementsText: DEFAULT_FILE_REQUIREMENTS_TEXT,
	chooseFilesButtonText: 'Choose files',
	dropInstructionText: 'or drop files',
	continueButtonText: 'Save and return'
} satisfies Partial<NonNullable<FileUploaderQuestionProps['text']>>;

type FileUploadQuestionDefaults = Partial<
	Pick<
		FileUploaderQuestionProps,
		| 'allowedFileExtensions'
		| 'allowedMimeTypes'
		| 'maxFileSizeBytes'
		| 'maxFileSizeLabel'
		| 'maxFilesPerUpload'
		| 'maxTotalUploadSizeBytes'
		| 'maxTotalUploadSizeLabel'
		| 'multiple'
		| 'validators'
	>
>;

type FileUploadQuestionParams = Pick<FileUploaderQuestionProps, 'title' | 'question' | 'fieldName' | 'url'> & {
	text: Pick<NonNullable<FileUploaderQuestionProps['text']>, 'caption'> &
		Partial<NonNullable<FileUploaderQuestionProps['text']>>;
} & FileUploadQuestionDefaults;

export function createFileUploadQuestion({
	title,
	question,
	fieldName,
	url,
	allowedFileExtensions = MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	allowedMimeTypes = MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	maxFileSizeBytes = SINGLE_FILE_UPLOAD_LIMIT,
	maxFileSizeLabel = SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	maxFilesPerUpload = UNLIMITED_FILES,
	maxTotalUploadSizeBytes = TOTAL_FILE_UPLOAD_LIMIT,
	maxTotalUploadSizeLabel = TOTAL_FILE_UPLOAD_LIMIT_LABEL,
	multiple = true,
	text,
	validators = []
}: FileUploadQuestionParams): FileUploaderQuestionProps {
	return {
		type: CUSTOM_COMPONENTS.FILE_UPLOADER,
		title,
		question,
		fieldName,
		url,
		allowedFileExtensions,
		allowedMimeTypes,
		maxFileSizeBytes,
		maxFileSizeLabel,
		maxFilesPerUpload,
		maxTotalUploadSizeBytes,
		maxTotalUploadSizeLabel,
		multiple,
		text: {
			...DEFAULT_FILE_UPLOAD_TEXT,
			...text
		},
		validators
	};
}

// Reads the plan reference from the route params.
export function getRoutePlanReference(req: Request): string | undefined {
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;

	return planReference || undefined;
}
