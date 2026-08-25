import type { Request } from 'express';
import { CUSTOM_COMPONENTS } from '@pins/local-plans-lib/forms/custom-components/index.ts';
import {
	SINGLE_FILE_UPLOAD_LIMIT,
	SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	TOTAL_FILE_UPLOAD_LIMIT,
	TOTAL_FILE_UPLOAD_LIMIT_LABEL
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/constants.ts';
import type { FileUploaderQuestionProps } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';

const UNLIMITED_FILES = Number.MAX_SAFE_INTEGER;
const DEFAULT_FILE_UPLOAD_TEXT = {
	chooseFilesButtonText: 'Choose files',
	dropInstructionText: 'or drop files',
	continueButtonText: 'Save and return'
} satisfies Partial<NonNullable<FileUploaderQuestionProps['text']>>;

type FileUploadQuestionDefaults = Partial<
	Pick<
		FileUploaderQuestionProps,
		| 'maxFileSizeBytes'
		| 'maxFileSizeLabel'
		| 'maxFilesPerUpload'
		| 'maxTotalUploadSizeBytes'
		| 'maxTotalUploadSizeLabel'
		| 'multiple'
		| 'validators'
	>
>;

type FileUploadQuestionParams = Pick<
	FileUploaderQuestionProps,
	'title' | 'question' | 'fieldName' | 'url' | 'allowedFileExtensions' | 'allowedMimeTypes'
> & {
	text: Pick<NonNullable<FileUploaderQuestionProps['text']>, 'caption' | 'introduction' | 'fileRequirementsText'> &
		Partial<NonNullable<FileUploaderQuestionProps['text']>>;
} & FileUploadQuestionDefaults;

export function createFileUploadQuestion({
	title,
	question,
	fieldName,
	url,
	allowedFileExtensions,
	allowedMimeTypes,
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
