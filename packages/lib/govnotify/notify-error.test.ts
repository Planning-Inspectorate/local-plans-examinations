import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { describeNotifyError } from './notify-error.ts';

function notifyApiError(status: number, errors: { error: string; message: string }[]) {
	return Object.assign(new Error(`Request failed with status code ${status}`), {
		response: { status, data: { status_code: status, errors } }
	});
}

describe('describeNotifyError', () => {
	describe('errors without a response', () => {
		for (const code of ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ECONNREFUSED', 'EAI_AGAIN', 'ENOTFOUND', 'EPIPE']) {
			it(`explains network error ${code}`, () => {
				assert.deepEqual(describeNotifyError(Object.assign(new Error('socket'), { code })), {
					hint: 'Could not reach GOV.UK Notify (network error)'
				});
			});
		}

		it('gives no details for a plain error', () => {
			assert.deepEqual(describeNotifyError(new Error('boom')), {});
		});

		it('gives no details for an unknown error code', () => {
			assert.deepEqual(describeNotifyError(Object.assign(new Error('x'), { code: 'ERR_INVALID_ARG_TYPE' })), {});
		});

		it('handles non-error values', () => {
			assert.deepEqual(describeNotifyError(undefined), {});
			assert.deepEqual(describeNotifyError(null), {});
			assert.deepEqual(describeNotifyError('a string'), {});
		});
	});

	describe('Notify responses', () => {
		it('explains a rate limit response', () => {
			const errors = [
				{ error: 'RateLimitError', message: 'Exceeded rate limit for key type LIVE of 3000 requests per 60 seconds' }
			];
			const details = describeNotifyError(notifyApiError(429, errors));

			assert.equal(details.status, 429);
			assert.deepEqual(details.notifyErrors, errors);
			assert.match(details.hint ?? '', /rate limit/i);
		});

		for (const status of [500, 502, 503]) {
			it(`explains a ${status} response`, () => {
				const details = describeNotifyError(
					notifyApiError(status, [{ error: 'Exception', message: 'Internal server error' }])
				);

				assert.equal(details.status, status);
				assert.match(details.hint ?? '', /unavailable/i);
			});
		}

		it('explains a team-only API key rejection', () => {
			const errors = [{ error: 'BadRequestError', message: "Can't send to this recipient using a team-only API key" }];
			const details = describeNotifyError(notifyApiError(400, errors));

			assert.equal(details.status, 400);
			assert.deepEqual(details.notifyErrors, errors);
			assert.match(details.hint ?? '', /team or guest list/);
		});

		it('explains a trial mode rejection', () => {
			const details = describeNotifyError(
				notifyApiError(400, [
					{
						error: 'BadRequestError',
						message:
							"Can't send to this recipient when service is in trial mode - see https://www.notifications.service.gov.uk/trial-mode"
					}
				])
			);

			assert.match(details.hint ?? '', /trial mode/);
		});

		it('explains an invalid template id', () => {
			const details = describeNotifyError(
				notifyApiError(400, [{ error: 'ValidationError', message: 'template_id is not a valid UUID' }])
			);

			assert.match(details.hint ?? '', /TEMPLATE_ID/);
		});

		it('explains a template that does not exist', () => {
			const details = describeNotifyError(
				notifyApiError(400, [{ error: 'BadRequestError', message: 'Template not found' }])
			);

			assert.match(details.hint ?? '', /TEMPLATE_ID/);
		});

		it('explains missing personalisation', () => {
			const details = describeNotifyError(
				notifyApiError(400, [{ error: 'BadRequestError', message: 'Missing personalisation: authCode' }])
			);

			assert.match(details.hint ?? '', /personalisation/i);
		});

		it('explains an API key rejection', () => {
			const details = describeNotifyError(
				notifyApiError(403, [{ error: 'AuthError', message: 'Invalid token: API key not found' }])
			);

			assert.equal(details.status, 403);
			assert.match(details.hint ?? '', /GOV_NOTIFY_API_KEY/);
		});

		it('gives no hint for an unrecognised 400', () => {
			const details = describeNotifyError(
				notifyApiError(400, [{ error: 'ValidationError', message: 'email_address Not a valid email address' }])
			);

			assert.equal(details.status, 400);
			assert.equal(details.hint, undefined);
		});

		it('copes with a response that has no errors array', () => {
			const error = Object.assign(new Error('bad'), { response: { status: 400, data: 'not json' } });

			assert.deepEqual(describeNotifyError(error), { status: 400, notifyErrors: undefined, hint: undefined });
		});
	});
});
