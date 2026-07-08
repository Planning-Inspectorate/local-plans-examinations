import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { FileUploaderSession } from './types.ts';

type RequestWithFileUploaderSession = Request & {
	session?: FileUploaderSession & Record<string, unknown>;
};

export type FileUploaderQuestionMiddlewareOptions = {
	questionUrls?: string[];
	sessionKey?: string | ((req: Request) => string);
};

export function fileUploaderQuestionMiddleware(options: FileUploaderQuestionMiddlewareOptions = {}): RequestHandler {
	const questionUrls = options.questionUrls ?? [];

	return (req: Request, res: Response, next: NextFunction) => {
		const request = req as RequestWithFileUploaderSession;
		const questionUrl = String(request.params.question);
		if (questionUrls.length > 0 && !questionUrls.includes(questionUrl)) {
			return next();
		}

		const journey = res.locals?.journey;
		const section = journey?.getSection?.(String(request.params.section));
		const question = journey?.getQuestionByParams?.(request.params);

		if (!question || !section || question.config?.type !== 'file-uploader') {
			return next();
		}

		const sessionKey =
			typeof options.sessionKey === 'function'
				? options.sessionKey(request)
				: (options.sessionKey ?? question.fieldName);
		const hasSessionErrors =
			(request.session?.errorSummary?.length ?? 0) > 0 || Object.keys(request.session?.errors ?? {}).length > 0;

		const viewModel = hasSessionErrors
			? question.checkForValidationErrors(request, section, journey)
			: question.toViewModel({
					params: request.params,
					section,
					journey,
					customViewData: {
						currentUrl: request.originalUrl,
						sessionKey,
						fileUploader: request.session?.fileUploader
					}
				});

		if (request.session) {
			delete request.session.errors;
			delete request.session.errorSummary;
		}

		return question.renderAction(res, viewModel);
	};
}
