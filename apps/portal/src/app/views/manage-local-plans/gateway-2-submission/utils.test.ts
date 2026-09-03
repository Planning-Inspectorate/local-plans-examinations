import { CUSTOM_COMPONENTS } from '@pins/local-plans-lib/forms/custom-components/index.ts';
import {
	SINGLE_FILE_UPLOAD_LIMIT,
	SINGLE_FILE_UPLOAD_LIMIT_LABEL,
	TOTAL_FILE_UPLOAD_LIMIT,
	TOTAL_FILE_UPLOAD_LIMIT_LABEL
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/constants.ts';
import type { Request } from 'express';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
	MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
	MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
	createFileUploadQuestion,
	getRoutePlanReference
} from './utils.ts';

describe('createFileUploadQuestion', () => {
	it('creates a file upload question with default upload settings and text', () => {
		const question = createFileUploadQuestion({
			title: 'Gateway 1 - Self Assessment of Readiness',
			question: 'Upload your Gateway 1 - Self assessment of readiness',
			fieldName: 'gateway1SelfAssessment',
			url: 'g1-self-assess',
			text: {
				caption: 'Consultation documents'
			}
		});

		assert.deepStrictEqual(question, {
			type: CUSTOM_COMPONENTS.FILE_UPLOADER,
			title: 'Gateway 1 - Self Assessment of Readiness',
			question: 'Upload your Gateway 1 - Self assessment of readiness',
			fieldName: 'gateway1SelfAssessment',
			url: 'g1-self-assess',
			allowedFileExtensions: MINIMAL_PROCEDURAL_ALLOWED_EXTENSIONS,
			allowedMimeTypes: MINIMAL_PROCEDURAL_ALLOWED_MIME_TYPES,
			maxFileSizeBytes: SINGLE_FILE_UPLOAD_LIMIT,
			maxFileSizeLabel: SINGLE_FILE_UPLOAD_LIMIT_LABEL,
			maxFilesPerUpload: Number.MAX_SAFE_INTEGER,
			maxTotalUploadSizeBytes: TOTAL_FILE_UPLOAD_LIMIT,
			maxTotalUploadSizeLabel: TOTAL_FILE_UPLOAD_LIMIT_LABEL,
			multiple: true,
			text: {
				caption: 'Consultation documents',
				introduction: 'Drag and drop or choose files',
				fileRequirementsText:
					'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.',
				chooseFilesButtonText: 'Choose files',
				dropInstructionText: 'or drop files',
				continueButtonText: 'Save and return'
			},
			validators: []
		});
	});

	it('allows upload settings and default text to be overridden', () => {
		const validator = () => undefined;
		const question = createFileUploadQuestion({
			title: 'Consultation on proposed local plan content and evidence documents',
			question: 'Upload your consultation on proposed local plan content and evidence documents',
			fieldName: 'consultationOnProposedContent',
			url: 'cons-of-proposed',
			allowedFileExtensions: ['pdf', 'doc'],
			allowedMimeTypes: ['application/pdf', 'application/msword'],
			maxFileSizeBytes: 100,
			maxFileSizeLabel: '100 bytes',
			maxFilesPerUpload: 1,
			maxTotalUploadSizeBytes: 200,
			maxTotalUploadSizeLabel: '200 bytes',
			multiple: false,
			text: {
				caption: 'Consultation documents',
				introduction: 'Upload files',
				fileRequirementsText: 'The file must be a PDF or DOC',
				chooseFilesButtonText: 'Select file',
				continueButtonText: 'Continue'
			},
			validators: [validator]
		});

		assert.strictEqual(question.maxFileSizeBytes, 100);
		assert.strictEqual(question.maxFileSizeLabel, '100 bytes');
		assert.strictEqual(question.maxFilesPerUpload, 1);
		assert.strictEqual(question.maxTotalUploadSizeBytes, 200);
		assert.strictEqual(question.maxTotalUploadSizeLabel, '200 bytes');
		assert.strictEqual(question.multiple, false);
		assert.deepStrictEqual(question.text, {
			caption: 'Consultation documents',
			introduction: 'Upload files',
			fileRequirementsText: 'The file must be a PDF or DOC',
			chooseFilesButtonText: 'Select file',
			dropInstructionText: 'or drop files',
			continueButtonText: 'Continue'
		});
		assert.deepStrictEqual(question.validators, [validator]);
	});
});

describe('getRoutePlanReference', () => {
	it('returns the route plan reference when present', () => {
		const req = {
			params: {
				planReference: 'PLAN-001'
			}
		} as unknown as Request;

		assert.strictEqual(getRoutePlanReference(req), 'PLAN-001');
	});

	it('returns the first route plan reference when Express provides an array', () => {
		const req = {
			params: {
				planReference: ['PLAN-001', 'PLAN-002']
			}
		} as unknown as Request;

		assert.strictEqual(getRoutePlanReference(req), 'PLAN-001');
	});

	it('returns undefined when the route plan reference is missing or empty', () => {
		assert.strictEqual(getRoutePlanReference({ params: {} } as unknown as Request), undefined);
		assert.strictEqual(getRoutePlanReference({ params: { planReference: '' } } as unknown as Request), undefined);
	});
});
