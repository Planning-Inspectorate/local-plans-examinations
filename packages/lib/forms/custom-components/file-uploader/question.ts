import { Question } from '@planning-inspectorate/dynamic-forms';
import { type Journey } from '@planning-inspectorate/dynamic-forms';
import escape from 'escape-html';
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
	fileUploaderSessionKey?: string;
	session?: FileUploaderCustomViewData & { fileUploader?: FileUploaderCustomViewData['fileUploader'] };
};
const FORMATTER_FUNCTION_MAP: Record<string, (files: UploadedFile[], notStartedText: string) => string> = {
	items: bulletListFormat,
	count: countFormat
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
		validationMessages = {},
		actionButtonVisibleInSummary = true,
		valueDisplayFormat = 'items',
		...params
	}: FileUploaderQuestionProps) {
		super({
			...params,
			viewFolder: 'forms/custom-components/file-uploader'
		});
		if (!(valueDisplayFormat in FORMATTER_FUNCTION_MAP)) {
			// Default to showing the items
			valueDisplayFormat = 'items';
		}

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
			text,
			validationMessages,
			actionButtonVisibleInSummary,
			valueDisplayFormat
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
			...this.config,
			editable: this.editable
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
				sessionKey: request.fileUploaderSessionKey ?? this.fieldName,
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

	isAnswered(journeyResponse: { answers: Record<string, unknown> }, fieldName = this.fieldName): boolean {
		const answer = journeyResponse.answers[fieldName];
		if (Array.isArray(answer)) {
			return answer.length > 0;
		}

		return super.isAnswered(journeyResponse as never, fieldName);
	}

	formatAnswerForSummary(
		sectionSegment: string,
		journey: any,
		answer: unknown
	): Array<{
		key: string;
		value: string;
		action: { href: string; text: string; visuallyHiddenText: string } | undefined;
	}> {
		const formatterFunction = this.config.valueDisplayFormat
			? FORMATTER_FUNCTION_MAP[this.config.valueDisplayFormat]
			: null;
		if (!formatterFunction) {
			throw Error(`No formatter function defined for '${this.config.valueDisplayFormat}' in FileUploaderQuestion`);
		}
		const files = Array.isArray(answer) ? (answer as UploadedFile[]) : [];
		const value = formatterFunction(files, this.notStartedText);
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

	getAction(sectionSegment: string, journey: Journey, answer: unknown) {
		if (this.actionLink) {
			// show the override if its set
			return {
				href: this.actionLink.href,
				text: this.actionLink.text,
				visuallyHiddenText: this.question
			};
		}
		if (!this.config.actionButtonVisibleInSummary) {
			return;
		}
		// The editable condition from the parent method is removed - the question will always have a view action
		const isAnswerProvided = answer !== null && answer !== undefined && answer !== '';

		return {
			href: journey.getCurrentQuestionUrl(sectionSegment, this.fieldName),
			text: isAnswerProvided ? this.changeActionText : this.answerActionText,
			visuallyHiddenText: this.question
		};
	}
}

function bulletListFormat(files: UploadedFile[], notStartedText: string): string {
	if (files.length === 0) {
		return notStartedText;
	}

	if (files.length === 1) {
		return escape(files[0].fileName);
	}

	const listItems = files.map((file) => `<li>${escape(file.fileName)}</li>`).join('');
	return `<ul class="govuk-list">${listItems}</ul>`;
}

function countFormat(files: UploadedFile[]): string {
	const pluralCharacter = files.length != 1 ? 's' : '';
	return `<ul class="govuk-list">${files.length} document${pluralCharacter}</ul>`;
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
