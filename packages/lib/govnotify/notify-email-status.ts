export const NotifyEmailStatus = {
	SENDING: 'sending',
	DELIVERED: 'delivered',
	PERMANENT_FAILURE: 'permanent-failure',
	TEMPORARY_FAILURE: 'temporary-failure',
	TECHNICAL_FAILURE: 'technical-failure'
} as const;

export type NotifyEmailStatus = (typeof NotifyEmailStatus)[keyof typeof NotifyEmailStatus];
