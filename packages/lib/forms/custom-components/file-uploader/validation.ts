import type { UploadedFile, UploadedRequestFile } from './types.ts';
import { sanitiseFileName } from '../../../storage/index.ts';
export { sanitiseFileName } from '../../../storage/index.ts';

export type FileValidationOptions = {
	allowedFileExtensions: string[];
	allowedMimeTypes?: string[];
	maxFileSizeBytes: number;
	maxFilesPerUpload: number;
	maxTotalUploadSizeBytes: number;
	uploadFormHref?: string;
};

export type FileValidationError = {
	text: string;
	href: string;
};

const DEFAULT_UPLOAD_FORM_HREF = '#upload-form';

export function normaliseExtension(extension: string): string {
	return extension.trim().replace(/^\./, '').toLowerCase();
}

export function getFileExtension(fileName: string): string {
	const extension = fileName.split('.').pop();
	return extension ? normaliseExtension(extension) : '';
}

export function validateFiles(
	files: UploadedRequestFile[],
	existingFiles: UploadedFile[],
	options: FileValidationOptions
): FileValidationError[] {
	const href = options.uploadFormHref ?? DEFAULT_UPLOAD_FORM_HREF;
	const errors: FileValidationError[] = [];
	const allowedExtensions = options.allowedFileExtensions.map(normaliseExtension);
	const allowedMimeTypes = options.allowedMimeTypes ?? [];

	if (files.length === 0) {
		errors.push({ text: 'Choose a file to upload', href });
	}

	if (files.length > options.maxFilesPerUpload) {
		errors.push({ text: `You can only upload up to ${options.maxFilesPerUpload} files at a time`, href });
	}

	if (existingFiles.length > 0 && existingFiles.length + files.length > options.maxFilesPerUpload) {
		errors.push({ text: `You can only upload up to ${options.maxFilesPerUpload} files in total`, href });
	}

	for (const file of files) {
		const extension = getFileExtension(file.originalname);
		if (!allowedExtensions.includes(extension)) {
			errors.push({ text: `${file.originalname} must be an allowed file type`, href });
		}

		if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
			errors.push({ text: `${file.originalname} is not an allowed file type`, href });
		}

		if (file.size > options.maxFileSizeBytes) {
			errors.push({ text: `${file.originalname} must be smaller than the maximum file size`, href });
		}
	}

	const existingNames = new Set(existingFiles.map((file) => file.fileName.toLowerCase()));
	for (const file of files) {
		if (existingNames.has(sanitiseFileName(file.originalname).toLowerCase())) {
			errors.push({ text: `${file.originalname} has already been uploaded`, href });
		}
	}

	const totalUploadedSize = existingFiles.reduce((sum, file) => sum + file.size, 0);
	const totalNewSize = files.reduce((sum, file) => sum + file.size, 0);
	if (totalUploadedSize + totalNewSize > options.maxTotalUploadSizeBytes) {
		errors.push({ text: 'The total size of uploaded files is too large', href });
	}

	return errors;
}
