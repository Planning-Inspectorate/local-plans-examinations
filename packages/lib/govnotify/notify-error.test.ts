import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AxiosError, AxiosHeaders } from 'axios';
import { NotifyError, NotifyErrorKind, NotifyErrorReason } from './notify-error.ts';
import type { NotifyApiError } from './notify-error.ts';

/** An error shaped like the one notifications-node-client (axios) throws when Notify responds with an error. */
function notifyApiError(status: number, data: unknown) {
	const config = { headers: new AxiosHeaders() };
	return new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST', config, undefined, {
		status,
		statusText: '',
		headers: {},
		config,
		data
	});
}

/** An error shaped like the one axios throws when Notify could not be reached at all. */
function networkError(code: string | undefined, message = 'socket hang up') {
	return new AxiosError(message, code, { headers: new AxiosHeaders() });
}

describe('NotifyErrorKind', () => {
	it('maps every kind to its own name', () => {
		for (const [key, value] of Object.entries(NotifyErrorKind)) {
			assert.equal(value, key);
		}
	});
});

describe('NotifyErrorReason', () => {
	it('maps every reason to its own name', () => {
		for (const [key, value] of Object.entries(NotifyErrorReason)) {
			assert.equal(value, key);
		}
	});
});

describe('NotifyError', () => {
	describe('constructor', () => {
		it('takes the message, kind and reason from the first Notify error', () => {
			const errors: NotifyApiError[] = [
				{ error: 'BadRequestError', message: "Can't send to this recipient using a team-only API key" },
				{ error: 'ValidationError', message: 'email_address Not a valid email address' }
			];
			const cause = new Error('original');

			const error = new NotifyError(400, errors, { cause });

			assert.ok(error instanceof Error);
			assert.ok(error instanceof NotifyError);
			assert.equal(error.name, 'NotifyError');
			assert.equal(error.message, "Can't send to this recipient using a team-only API key");
			assert.equal(error.status, 400);
			assert.equal(error.kind, NotifyErrorKind.BadRequestError);
			assert.equal(error.reason, NotifyErrorReason.TEAM_ONLY_KEY);
			assert.deepEqual(error.errors, errors);
			assert.equal(error.cause, cause);
		});

		it('falls back to an unknown error when Notify sent no errors', () => {
			const error = new NotifyError(500, []);

			assert.equal(error.message, 'Unknown Notify error');
			assert.equal(error.kind, 'Unknown');
			assert.equal(error.status, 500);
			assert.equal(error.reason, NotifyErrorReason.SERVER_ERROR);
			assert.deepEqual(error.errors, []);
			assert.equal(error.cause, undefined);
		});

		it('exposes kind, status and reason through getters', () => {
			const error = new NotifyError(429, [{ error: 'RateLimitError', message: 'Exceeded rate limit' }]);

			assert.equal(error.getKind(), NotifyErrorKind.RateLimitError);
			assert.equal(error.getStatus(), 429);
			assert.equal(error.getReason(), NotifyErrorReason.RATE_LIMIT);
		});
	});

	describe('from', () => {
		it('returns a NotifyError unchanged', () => {
			const original = new NotifyError(400, [{ error: 'BadRequestError', message: 'Template not found' }]);

			assert.equal(NotifyError.from(original), original);
		});

		it('builds an error from a Notify error response', () => {
			const errors = [{ error: 'BadRequestError', message: 'Missing personalisation: authCode' }];
			const axiosError = notifyApiError(400, { status_code: 400, errors });

			const error = NotifyError.from(axiosError);

			assert.equal(error.status, 400);
			assert.equal(error.kind, NotifyErrorKind.BadRequestError);
			assert.equal(error.reason, NotifyErrorReason.MISSING_PERSONALISATION);
			assert.equal(error.message, 'Missing personalisation: authCode');
			assert.deepEqual(error.errors, errors);
			assert.equal(error.cause, axiosError);
		});

		it('keeps every error from the Notify response', () => {
			const errors = [
				{ error: 'ValidationError', message: 'email_address Not a valid email address' },
				{ error: 'ValidationError', message: 'template_id is not a valid UUID' }
			];

			const error = NotifyError.from(notifyApiError(400, { status_code: 400, errors }));

			assert.deepEqual(error.errors, errors);
			assert.equal(error.reason, NotifyErrorReason.INVALID_RECIPIENT);
		});

		it('uses the axios message when the response has an empty errors array', () => {
			const axiosError = notifyApiError(500, { status_code: 500, errors: [] });

			const error = NotifyError.from(axiosError);

			assert.equal(error.status, 500);
			assert.equal(error.kind, 'Unknown');
			assert.equal(error.message, 'Request failed with status code 500');
			assert.equal(error.reason, NotifyErrorReason.SERVER_ERROR);
			assert.deepEqual(error.errors, [{ error: 'Unknown', message: 'Request failed with status code 500' }]);
		});

		it('copes with a response body that is not JSON', () => {
			const error = NotifyError.from(notifyApiError(502, '<html>Bad gateway</html>'));

			assert.equal(error.status, 502);
			assert.equal(error.kind, 'Unknown');
			assert.equal(error.reason, NotifyErrorReason.SERVER_ERROR);
		});

		it('copes with a response that has no body', () => {
			const error = NotifyError.from(notifyApiError(404, undefined));

			assert.equal(error.status, 404);
			assert.equal(error.reason, NotifyErrorReason.NOT_FOUND);
		});

		for (const code of ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ECONNREFUSED', 'EAI_AGAIN', 'ENOTFOUND']) {
			it(`treats ${code} with no response as a network error`, () => {
				const axiosError = networkError(code);

				const error = NotifyError.from(axiosError);

				assert.equal(error.status, 0);
				assert.equal(error.kind, NotifyErrorKind.NetworkError);
				assert.equal(error.reason, NotifyErrorReason.NETWORK);
				assert.equal(error.message, code);
				assert.equal(error.cause, axiosError);
			});
		}

		it('uses the axios message for a network error with no code', () => {
			const error = NotifyError.from(networkError(undefined, 'socket hang up'));

			assert.equal(error.kind, NotifyErrorKind.NetworkError);
			assert.equal(error.reason, NotifyErrorReason.NETWORK);
			assert.equal(error.message, 'socket hang up');
		});

		it('wraps a plain error as unknown', () => {
			const original = new Error('boom');

			const error = NotifyError.from(original);

			assert.equal(error.status, 0);
			assert.equal(error.kind, 'Unknown');
			assert.equal(error.reason, NotifyErrorReason.UNKNOWN);
			assert.equal(error.message, 'boom');
			assert.equal(error.cause, original);
		});

		it('does not treat a non-axios error with a response as a Notify response', () => {
			const original = Object.assign(new Error('Request failed with status code 429'), {
				response: { status: 429, data: { errors: [{ error: 'RateLimitError', message: 'Exceeded rate limit' }] } }
			});

			const error = NotifyError.from(original);

			assert.equal(error.status, 0);
			assert.equal(error.kind, 'Unknown');
			assert.equal(error.reason, NotifyErrorReason.UNKNOWN);
		});

		for (const value of ['a string', undefined, null, 42]) {
			it(`wraps the non-error value ${JSON.stringify(value)}`, () => {
				const error = NotifyError.from(value);

				assert.equal(error.status, 0);
				assert.equal(error.kind, 'Unknown');
				assert.equal(error.reason, NotifyErrorReason.UNKNOWN);
				assert.equal(error.message, String(value));
				assert.equal(error.cause, value);
			});
		}
	});

	describe('classify', () => {
		const messageRules: [string, string, NotifyErrorReason][] = [
			['BadRequestError', "Can't send to this recipient using a team-only API key", 'TEAM_ONLY_KEY'],
			[
				'BadRequestError',
				"Can't send to this recipient when service is in trial mode - see https://www.notifications.service.gov.uk/trial-mode",
				'TRIAL_MODE'
			],
			['BadRequestError', 'Missing personalisation: authCode', 'MISSING_PERSONALISATION'],
			['BadRequestError', 'Template not found', 'TEMPLATE_NOT_FOUND'],
			['BadRequestError', 'Template has been deleted', 'TEMPLATE_DELETED'],
			['BadRequestError', 'sms template is not suitable for email notification', 'WRONG_TEMPLATE_TYPE'],
			['BadRequestError', 'Text messages cannot be longer than 918 characters', 'MESSAGE_TOO_LONG'],
			['BadRequestError', 'Your message is empty.', 'MESSAGE_EMPTY'],
			[
				'BadRequestError',
				'email_reply_to_id 7b1f0c2e-0000-0000-0000-000000000000 does not exist in database',
				'REPLY_TO_NOT_FOUND'
			],
			['BadRequestError', 'Service is not allowed to send emails', 'SERVICE_NOT_ALLOWED'],
			['ValidationError', 'email_address Not a valid email address', 'INVALID_RECIPIENT'],
			['ValidationError', "Recipient can't be empty", 'INVALID_RECIPIENT'],
			['AuthError', 'Invalid token: API key not found', 'KEY_NOT_FOUND'],
			['AuthError', 'Invalid token: API key revoked', 'KEY_REVOKED'],
			['AuthError', 'Error: Your system clock must be accurate to within 30 seconds', 'CLOCK_SKEW'],
			['RateLimitError', 'Exceeded rate limit for key type LIVE of 3000 requests per 60 seconds', 'RATE_LIMIT'],
			['TooManyRequestsError', 'Exceeded send limits (250) for today', 'DAILY_LIMIT']
		];
		for (const [kind, message, reason] of messageRules) {
			it(`classifies "${message}" as ${reason}`, () => {
				assert.equal(NotifyError.classify(400, { error: kind, message }), reason);
			});
		}

		it('matches messages case-insensitively', () => {
			assert.equal(
				NotifyError.classify(400, { error: 'BadRequestError', message: 'USING A TEAM-ONLY API KEY' }),
				'TEAM_ONLY_KEY'
			);
		});

		it('only treats missing personalisation at the start of the message as missing personalisation', () => {
			assert.equal(
				NotifyError.classify(400, { error: 'BadRequestError', message: 'Error: Missing personalisation: authCode' }),
				'UNKNOWN'
			);
		});

		it('classifies a network error as NETWORK whatever the message says', () => {
			assert.equal(NotifyError.classify(0, { error: 'NetworkError', message: 'Exceeded rate limit' }), 'NETWORK');
		});

		it('prefers a matching message over the error kind', () => {
			assert.equal(
				NotifyError.classify(400, { error: 'ValidationError', message: 'Template not found' }),
				'TEMPLATE_NOT_FOUND'
			);
		});

		const kindFallbacks: [number, string, NotifyErrorReason][] = [
			[429, 'RateLimitError', 'RATE_LIMIT'],
			[429, 'TooManyRequestsError', 'DAILY_LIMIT'],
			[400, 'ValidationError', 'SCHEMA_VALIDATION'],
			[401, 'AuthError', 'UNAUTHORIZED'],
			[403, 'AuthError', 'INVALID_TOKEN']
		];
		for (const [status, kind, reason] of kindFallbacks) {
			it(`classifies an unrecognised ${status} ${kind} as ${reason}`, () => {
				assert.equal(NotifyError.classify(status, { error: kind, message: 'something unexpected' }), reason);
			});
		}

		const statusFallbacks: [number, NotifyErrorReason][] = [
			[404, 'NOT_FOUND'],
			[504, 'TIMEOUT'],
			[500, 'SERVER_ERROR'],
			[502, 'SERVER_ERROR'],
			[503, 'SERVER_ERROR'],
			[400, 'UNKNOWN'],
			[0, 'UNKNOWN']
		];
		for (const [status, reason] of statusFallbacks) {
			it(`classifies an unrecognised ${status} response as ${reason}`, () => {
				assert.equal(NotifyError.classify(status, { error: 'Exception', message: 'something unexpected' }), reason);
			});
		}
	});
});
