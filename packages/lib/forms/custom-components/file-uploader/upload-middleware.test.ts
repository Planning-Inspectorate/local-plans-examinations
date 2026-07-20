import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { fileUploaderQuestionMiddleware } from './upload-middleware.ts';

describe('fileUploaderQuestionMiddleware', () => {
	it('passes through when the current question is not a configured file uploader question', () => {
		const next = mock.fn();
		const middleware = fileUploaderQuestionMiddleware({ questionUrls: ['documents'] });
		const req = buildRequest({ params: { question: 'other-question' } });
		const res = buildResponse();

		middleware(req, res, next);

		assert.equal(next.mock.callCount(), 1);
		assert.equal(res.locals.journey.getQuestionByParams.mock.callCount(), 0);
	});

	it('renders the file uploader question with session upload data', () => {
		const next = mock.fn();
		const question = buildQuestion();
		const middleware = fileUploaderQuestionMiddleware();
		const req = buildRequest({
			originalUrl: '/case/gateway-2/documents',
			session: {
				fileUploader: {
					documents: {
						uploadedFiles: [{ id: 'file-1', fileName: 'cover-letter.pdf' }]
					}
				}
			}
		});
		const res = buildResponse({ question });

		middleware(req, res, next);

		assert.equal(next.mock.callCount(), 0);
		assert.equal(question.toViewModel.mock.callCount(), 1);
		const toViewModelCall = question.toViewModel.mock.calls[0];
		assert.ok(toViewModelCall);
		assert.deepEqual(toViewModelCall.arguments[0].customViewData, {
			currentUrl: '/case/gateway-2/documents',
			sessionKey: 'documents',
			fileUploader: req.session.fileUploader
		});
		assert.deepEqual(question.renderAction.mock.calls[0].arguments, [res, { rendered: 'view-model' }]);
	});

	it('uses validation errors from the session and clears them after rendering', () => {
		const next = mock.fn();
		const question = buildQuestion();
		const middleware = fileUploaderQuestionMiddleware();
		const req = buildRequest({
			session: {
				errors: { 'upload-form': { msg: 'Errors encountered during file upload' } },
				errorSummary: [{ text: 'Choose a file to upload', href: '#upload-form' }]
			}
		});
		const res = buildResponse({ question });

		middleware(req, res, next);

		assert.equal(next.mock.callCount(), 0);
		assert.equal(question.checkForValidationErrors.mock.callCount(), 1);
		assert.deepEqual(question.renderAction.mock.calls[0].arguments, [res, { rendered: 'error-view-model' }]);
		assert.equal(req.session.errors, undefined);
		assert.equal(req.session.errorSummary, undefined);
	});

	it('passes the resolved session key when rendering validation errors', () => {
		const next = mock.fn();
		const question = buildQuestion();
		const middleware = fileUploaderQuestionMiddleware({
			sessionKey: (req) => `${req.params.planReference}:documents`
		});
		const req = buildRequest({
			params: {
				planReference: 'LPE-TEST-001',
				section: 'case',
				question: 'documents'
			},
			session: {
				errors: { 'upload-form': { msg: 'Errors encountered during file upload' } },
				errorSummary: [{ text: 'You can only upload up to 1 files in total', href: '#upload-form' }],
				fileUploader: {
					'LPE-TEST-001:documents': {
						uploadedFiles: [{ id: 'file-1', fileName: 'cover-letter.pdf' }]
					}
				}
			}
		});
		const res = buildResponse({ question });

		middleware(req, res, next);

		assert.equal(next.mock.callCount(), 0);
		assert.equal(req.fileUploaderSessionKey, 'LPE-TEST-001:documents');
		assert.equal(question.checkForValidationErrors.mock.callCount(), 1);
		assert.equal(
			question.checkForValidationErrors.mock.calls[0].arguments[0].fileUploaderSessionKey,
			'LPE-TEST-001:documents'
		);
	});
});

function buildQuestion() {
	return {
		fieldName: 'documents',
		config: { type: 'file-uploader' },
		toViewModel: mock.fn((_options: { customViewData?: unknown }) => ({ rendered: 'view-model' })),
		checkForValidationErrors: mock.fn(() => ({ rendered: 'error-view-model' })),
		renderAction: mock.fn()
	};
}

function buildRequest(overrides: Record<string, any> = {}) {
	return {
		params: {
			section: 'case',
			question: 'documents'
		},
		originalUrl: '/case/documents',
		session: {},
		...overrides
	} as any;
}

function buildResponse({ question = buildQuestion() } = {}) {
	const section = { name: 'Case section' };

	return {
		locals: {
			journey: {
				getSection: mock.fn(() => section),
				getQuestionByParams: mock.fn(() => question)
			}
		}
	} as any;
}
