import type { Logger } from 'pino';
import type { RequestHandler } from 'express';

export function buildLogRequestsMiddleware(logger: Logger): RequestHandler {
	return (_, res, next) => {
		const { req, statusCode } = res;
		logger.debug(`${req.method} ${statusCode} ${req.originalUrl.toString()}`);
		next();
	};
}
