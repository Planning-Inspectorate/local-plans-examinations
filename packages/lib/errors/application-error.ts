import type { Logger } from 'pino';

/**
 * Application error that separates technical details (for logs) from user messages (for UI)
 */
export class ApplicationError extends Error {
	readonly cause?: Error;

	constructor(message: string, cause?: Error) {
		super(message);
		this.name = 'ApplicationError';
		this.cause = cause;
	}
}

/**
 * Creates an application error and logs technical details
 */
export const createApplicationError = (
	logger: Logger,
	technicalMessage: string,
	userMessage: string,
	cause?: string
): ApplicationError => {
	logger.error(`${technicalMessage}: ${String(cause)}`);
	return new ApplicationError(userMessage);
};
