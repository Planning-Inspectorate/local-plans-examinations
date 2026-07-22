import type BaseValidator from '@planning-inspectorate/dynamic-forms/src/validator/base-validator.js';
import type { FileStorageProvider, UploadedFile } from '../../../storage/index.ts';
export type {
	FileStorageProvider,
	FileUploadDestination,
	FileUploadStorageAdapter,
	FileUploadStorageAdapterFactory,
	UploadedFile,
	UploadedRequestFile
} from '../../../storage/index.ts';

export const FILE_UPLOADER_COMPONENT_TYPE = 'file-uploader' as const;

export type FileUploaderStorageProvider = FileStorageProvider;

export type UploadedFileGroup = {
	uploadedFiles: UploadedFile[];
};

export type FileUploaderSession = {
	fileUploader?: Record<string, UploadedFileGroup>;
	errors?: Record<string, { msg: string }>;
	errorSummary?: Array<{ text: string; href: string }>;
};

export type FileUploaderText = {
	caption?: string;
	introduction?: string;
	bulletList?: string[];
	fileRequirementsText?: string;
	totalUploadSizeText?: string;
	uploadLabel?: string;
	uploadButtonText?: string;
	chooseFilesButtonText?: string;
	dropInstructionText?: string;
	uploadingText?: string;
	removeLinkText?: string;
	continueButtonText?: string;
	continueAction?: string;
	returnLink?: {
		href?: string;
		text: string;
	};
};

export type FileUploaderQuestionConfig = {
	type: typeof FILE_UPLOADER_COMPONENT_TYPE;
	allowedFileExtensions: string[];
	allowedMimeTypes?: string[];
	maxFileSizeBytes: number;
	maxFileSizeLabel: string;
	maxFilesPerUpload?: number;
	maxTotalUploadSizeBytes?: number;
	maxTotalUploadSizeLabel?: string;
	multiple?: boolean;
	text?: FileUploaderText;
};

export type FileUploaderQuestionProps = FileUploaderQuestionConfig & {
	title: string;
	question: string;
	fieldName: string;
	url?: string;
	pageTitle?: string;
	description?: string;
	hint?: string;
	validators?: BaseValidator[];
};

export type FileUploaderViewModel = Record<string, unknown> & {
	question: Record<string, unknown> & FileUploaderQuestionConfig;
	uploadedFiles: UploadedFile[];
	uploadedFilesEncoded: string;
	errors?: Record<string, { msg: string }>;
	errorSummary?: Array<{ text: string; href: string }>;
	currentUrl?: string;
};

export type FileUploaderCustomViewData = {
	currentUrl?: string;
	sessionKey?: string;
	fileUploader?: FileUploaderSession['fileUploader'];
	errors?: FileUploaderSession['errors'];
	errorSummary?: FileUploaderSession['errorSummary'];
};
