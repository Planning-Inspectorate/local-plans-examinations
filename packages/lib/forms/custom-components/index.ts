import type { QuestionProps } from '@planning-inspectorate/dynamic-forms/types/src/questions/create-questions.d.ts';
import {
	FILE_UPLOADER_COMPONENT_TYPE,
	FileUploaderQuestion,
	type FileUploaderQuestionProps
} from './file-uploader/index.ts';

export type CrownQuestionProps = QuestionProps | FileUploaderQuestionProps;

export const CUSTOM_COMPONENTS = Object.freeze({
	FILE_UPLOADER: FILE_UPLOADER_COMPONENT_TYPE
} as const);

export const CUSTOM_COMPONENT_CLASSES = Object.freeze({
	[CUSTOM_COMPONENTS.FILE_UPLOADER]: FileUploaderQuestion
} as const);
