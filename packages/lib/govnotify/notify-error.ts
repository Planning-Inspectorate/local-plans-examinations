import { isAxiosError } from 'axios';

export interface NotifyApiError {
	error: string;
	message: string;
}
const MESSAGE_RULES: [RegExp, NotifyErrorReason][] = [
	[/team-only API key/i, 'TEAM_ONLY_KEY'],
	[/trial mode/i, 'TRIAL_MODE'],
	[/^Missing personalisation/i, 'MISSING_PERSONALISATION'],
	[/Template not found/i, 'TEMPLATE_NOT_FOUND'],
	[/Template has been deleted/i, 'TEMPLATE_DELETED'],
	[/template is not suitable for/i, 'WRONG_TEMPLATE_TYPE'],
	[/cannot be longer than/i, 'MESSAGE_TOO_LONG'],
	[/Your message is empty/i, 'MESSAGE_EMPTY'],
	[/reply_to_id .* does not exist/i, 'REPLY_TO_NOT_FOUND'],
	[/Service is not allowed to send/i, 'SERVICE_NOT_ALLOWED'],
	[/Not a valid email address|Recipient can.t be empty/i, 'INVALID_RECIPIENT'],
	[/API key not found/i, 'KEY_NOT_FOUND'],
	[/API key revoked/i, 'KEY_REVOKED'],
	[/system clock/i, 'CLOCK_SKEW'],
	[/Exceeded rate limit/i, 'RATE_LIMIT'],
	[/Exceeded send limits/i, 'DAILY_LIMIT']
];

export const NotifyErrorKind = {
	BadRequestError: 'BadRequestError',
	ValidationError: 'ValidationError',
	InvalidEmailError: 'InvalidEmailError',
	AuthError: 'AuthError',
	RateLimitError: 'RateLimitError',
	TooManyRequestsError: 'TooManyRequestsError',
	NoResultFound: 'NoResultFound',
	RequestHandlingTimeout: 'RequestHandlingTimeout',
	Exception: 'Exception',
	NetworkError: 'NetworkError'
} as const;

export const NotifyErrorReason = {
	TEAM_ONLY_KEY: 'TEAM_ONLY_KEY',
	TRIAL_MODE: 'TRIAL_MODE',
	MISSING_PERSONALISATION: 'MISSING_PERSONALISATION',
	TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
	TEMPLATE_DELETED: 'TEMPLATE_DELETED',
	WRONG_TEMPLATE_TYPE: 'WRONG_TEMPLATE_TYPE',
	MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
	MESSAGE_EMPTY: 'MESSAGE_EMPTY',
	REPLY_TO_NOT_FOUND: 'REPLY_TO_NOT_FOUND',
	SERVICE_NOT_ALLOWED: 'SERVICE_NOT_ALLOWED',
	INVALID_RECIPIENT: 'INVALID_RECIPIENT',
	SCHEMA_VALIDATION: 'SCHEMA_VALIDATION',
	KEY_NOT_FOUND: 'KEY_NOT_FOUND',
	KEY_REVOKED: 'KEY_REVOKED',
	CLOCK_SKEW: 'CLOCK_SKEW',
	INVALID_TOKEN: 'INVALID_TOKEN',
	UNAUTHORIZED: 'UNAUTHORIZED',
	RATE_LIMIT: 'RATE_LIMIT',
	DAILY_LIMIT: 'DAILY_LIMIT',
	NOT_FOUND: 'NOT_FOUND',
	TIMEOUT: 'TIMEOUT',
	SERVER_ERROR: 'SERVER_ERROR',
	NETWORK: 'NETWORK',
	UNKNOWN: 'UNKNOWN'
} as const;

export type NotifyErrorReason = (typeof NotifyErrorReason)[keyof typeof NotifyErrorReason];

export class NotifyError extends Error {
	readonly kind: NotifyErrorKind;
	readonly status: number;
	readonly reason: NotifyErrorReason;
	readonly errors: NotifyApiError[];

	constructor(status: number, errors: NotifyApiError[], options?: { cause?: unknown }) {
		const first = errors[0] ?? { error: 'Unknown', message: 'Unknown Notify error' };
		super(first.message, options);
		this.name = 'NotifyError';
		this.status = status;
		this.errors = errors;
		this.kind = first.error;
		this.reason = NotifyError.classify(status, first);
	}

	/** Builds a NotifyError from whatever notifications-node-client threw. */
	static from(error: unknown): NotifyError {
		if (error instanceof NotifyError) return error;
		if (isAxiosError(error)) {
			if (!error.response) {
				return new NotifyError(0, [{ error: 'NetworkError', message: error.code ?? error.message }], { cause: error });
			}
			const body = error.response.data as { errors?: NotifyApiError[] } | undefined;
			const errors = body?.errors?.length ? body.errors : [{ error: 'Unknown', message: error.message }];
			return new NotifyError(error.response.status, errors, { cause: error });
		}
		const message = error instanceof Error ? error.message : String(error);
		return new NotifyError(0, [{ error: 'Unknown', message }], { cause: error });
	}

	static classify(status: number, { error, message }: NotifyApiError): NotifyErrorReason {
		if (error === 'NetworkError') return 'NETWORK';
		const match = MESSAGE_RULES.find(([pattern]) => pattern.test(message));
		if (match) return match[1];
		if (error === 'RateLimitError') return 'RATE_LIMIT';
		if (error === 'TooManyRequestsError') return 'DAILY_LIMIT';
		if (error === 'ValidationError') return 'SCHEMA_VALIDATION';
		if (error === 'AuthError') return status === 401 ? 'UNAUTHORIZED' : 'INVALID_TOKEN';
		if (status === 404) return 'NOT_FOUND';
		if (status === 504) return 'TIMEOUT';
		if (status >= 500) return 'SERVER_ERROR';
		return 'UNKNOWN';
	}

	getKind(): NotifyErrorKind {
		return this.kind;
	}
	getStatus(): number {
		return this.status;
	}
	getReason(): NotifyErrorReason {
		return this.reason;
	}
}
