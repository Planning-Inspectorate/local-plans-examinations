import { Question } from '@planning-inspectorate/dynamic-forms';
import type {
	FileUploaderCustomViewData,
	FileUploaderQuestionConfig,
	FileUploaderQuestionProps,
	FileUploaderViewModel,
	UploadedFile
} from './types.ts';
import { MAX_NO_OF_FILES_TO_UPLOAD, TOTAL_FILE_UPLOAD_LIMIT, TOTAL_FILE_UPLOAD_LIMIT_LABEL } from './constants.ts';

type CheckForValidationErrorsParams = Parameters<Question['checkForValidationErrors']>;
type RequestWithFileUploaderCustomViewData = CheckForValidationErrorsParams[0] & {
	session?: FileUploaderCustomViewData & { fileUploader?: FileUploaderCustomViewData['fileUploader'] };
};

export default class FileUploaderQuestion extends Question {
	readonly config: FileUploaderQuestionConfig;

	constructor({
		allowedFileExtensions,
		allowedMimeTypes = [],
		maxFileSizeBytes,
		maxFileSizeLabel,
		maxFilesPerUpload = MAX_NO_OF_FILES_TO_UPLOAD,
		maxTotalUploadSizeBytes = TOTAL_FILE_UPLOAD_LIMIT,
		maxTotalUploadSizeLabel = TOTAL_FILE_UPLOAD_LIMIT_LABEL,
		multiple = true,
		text = {},
		...params
	}: FileUploaderQuestionProps) {
		super({
			...params,
			viewFolder: 'custom-components/file-uploader'
		});

		this.config = {
			type: 'file-uploader',
			allowedFileExtensions,
			allowedMimeTypes,
			maxFileSizeBytes,
			maxFileSizeLabel,
			maxFilesPerUpload,
			maxTotalUploadSizeBytes,
			maxTotalUploadSizeLabel,
			multiple,
			text
		};
	}

	toViewModel(options: any): FileUploaderViewModel {
		const viewModel = super.toViewModel(options as never) as FileUploaderViewModel;
		const fieldName = String(viewModel.question.fieldName);
		const sessionKey = options.customViewData?.sessionKey ?? fieldName;
		const uploadedFiles =
			options.customViewData?.fileUploader?.[sessionKey]?.uploadedFiles ??
			readUploadedFiles(options.payload?.[fieldName]);

		viewModel.question = {
			...viewModel.question,
			...this.config
		};
		viewModel.uploadedFiles = uploadedFiles;
		viewModel.uploadedFilesEncoded = Buffer.from(JSON.stringify(uploadedFiles), 'utf-8').toString('base64');
		viewModel.currentUrl = options.customViewData?.currentUrl;
		viewModel.errors = options.customViewData?.errors;
		viewModel.errorSummary = options.customViewData?.errorSummary;

		return viewModel;
	}

	checkForValidationErrors(
		req: CheckForValidationErrorsParams[0],
		section: CheckForValidationErrorsParams[1],
		journey: CheckForValidationErrorsParams[2],
		manageListQuestion?: CheckForValidationErrorsParams[3]
	): FileUploaderViewModel | undefined {
		const request = req as RequestWithFileUploaderCustomViewData;
		const bodyErrorSummary = Array.isArray(request.body?.errorSummary) ? request.body.errorSummary : [];
		const sessionErrorSummary = Array.isArray(request.session?.errorSummary) ? request.session.errorSummary : [];
		const hasBodyErrors = bodyErrorSummary.length > 0;
		const hasSessionErrors = sessionErrorSummary.length > 0;

		if (!hasBodyErrors && !hasSessionErrors) {
			return undefined;
		}

		return this.toViewModel({
			params: request.params,
			section,
			journey,
			manageListQuestion,
			customViewData: {
				currentUrl: request.originalUrl,
				sessionKey: this.fieldName,
				fileUploader: request.session?.fileUploader,
				errors: hasBodyErrors
					? (request.body?.errors as FileUploaderCustomViewData['errors'])
					: request.session?.errors,
				errorSummary: hasBodyErrors
					? (request.body?.errorSummary as FileUploaderCustomViewData['errorSummary'])
					: request.session?.errorSummary
			}
		});
	}

	async getDataToSave(req: { body?: Record<string, unknown> }): Promise<{ answers: Record<string, UploadedFile[]> }> {
		return {
			answers: {
				[this.fieldName]: readUploadedFiles(req.body?.[this.fieldName])
			}
		};
	}

	formatAnswerForSummary(
		sectionSegment: string,
		journey: any,
		answer: unknown
	): Array<{
		key: string;
		value: string;
		action: { href: string; text: string; visuallyHiddenText: string };
	}> {
		const files = Array.isArray(answer) ? (answer as UploadedFile[]) : [];
		const value = files.length > 0 ? files.map((file) => file.fileName).join('<br>') : this.notStartedText;

		return [
			{
				key: this.title,
				value,
				action: this.getAction(sectionSegment, journey, answer as never) as {
					href: string;
					text: string;
					visuallyHiddenText: string;
				}
			}
		];
	}
}

function readUploadedFiles(value: unknown): UploadedFile[] {
	if (Array.isArray(value)) {
		return value as UploadedFile[];
	}

	if (typeof value !== 'string' || value.length === 0) {
		return [];
	}

	try {
		return JSON.parse(Buffer.from(value, 'base64').toString('utf-8')) as UploadedFile[];
	} catch {
		return [];
	}
}
