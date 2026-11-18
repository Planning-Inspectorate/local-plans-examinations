export interface NotifyApiError {
	error?: string;
	message?: string;
}

export interface NotifyErrorDetails {
	/** HTTP status returned by GOV.UK Notify, if a response was received */
	status?: number;
	/** the `errors` array from the Notify response body */
	notifyErrors?: NotifyApiError[];
	/** an actionable explanation for the logs, when the cause is recognised */
	hint?: string;
}

type ErrorWithResponse = {
	code?: unknown;
	response?: {
		status?: unknown;
		data?: { errors?: unknown };
	};
};

const NETWORK_ERROR_CODES = new Set([
	'ECONNABORTED',
	'ECONNREFUSED',
	'ECONNRESET',
	'EAI_AGAIN',
	'ENOTFOUND',
	'EPIPE',
	'ETIMEDOUT'
]);

/**
 * Pull the useful parts out of an error thrown by notifications-node-client, with a hint for the logs.
 */
export function describeNotifyError(error: unknown): NotifyErrorDetails {
	const err = (error ?? {}) as ErrorWithResponse;
	const response = err.response;

	if (!response) {
		const isNetworkError = typeof err.code === 'string' && NETWORK_ERROR_CODES.has(err.code);
		return isNetworkError ? { hint: 'Could not reach GOV.UK Notify (network error)' } : {};
	}

	const status = typeof response.status === 'number' ? response.status : undefined;
	const notifyErrors = Array.isArray(response.data?.errors) ? (response.data.errors as NotifyApiError[]) : undefined;

	return { status, notifyErrors, hint: hintFor(status, notifyErrors) };
}

function hintFor(status: number | undefined, notifyErrors: NotifyApiError[] | undefined): string | undefined {
	const text = (notifyErrors ?? [])
		.map((e) => `${e.error ?? ''} ${e.message ?? ''}`)
		.join(' ')
		.toLowerCase();

	if (status === 429) {
		return 'GOV.UK Notify rate limit reached';
	}
	if (status !== undefined && status >= 500) {
		return 'GOV.UK Notify is currently unavailable';
	}
	if (status === 403) {
		return 'GOV.UK Notify rejected the API key - check GOV_NOTIFY_API_KEY';
	}
	if (text.includes('team-only api key')) {
		return 'Recipient is not in the GOV.UK Notify team or guest list - add them there, or use a live API key';
	}
	if (text.includes('trial mode')) {
		return 'GOV.UK Notify service is in trial mode - add the recipient to the guest list, or make the service live';
	}
	if (text.includes('missing personalisation')) {
		return 'Template personalisation does not match the fields sent - check the template in GOV.UK Notify';
	}
	if (text.includes('template')) {
		return 'Template id is invalid or does not exist - check the GOV_NOTIFY_*_TEMPLATE_ID setting for this email';
	}
	return undefined;
}
