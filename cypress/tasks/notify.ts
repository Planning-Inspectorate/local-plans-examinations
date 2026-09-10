import { setTimeout as delay } from 'node:timers/promises';
import type { Logger } from 'pino';
import { GovNotifyClient } from '../../packages/lib/govnotify/gov-notify-client.ts';

type NotifyEmailLookupArgs = {
	reference: string;
	templateId?: string;
};

const cypressLogger = {
	debug: console.debug,
	error: console.error,
	info: console.info,
	trace: console.trace,
	warn: console.warn
} as unknown as Logger;

const getNotifyClient = () => {
	return new GovNotifyClient(cypressLogger, getRequiredProcessEnv('GOV_NOTIFY_API_KEY'), {});
};

const getRequiredProcessEnv = (name: string) => {
	const value = process.env[name];

	if (!value || value.startsWith('$(')) {
		throw new Error(`${name} is required`);
	}

	return value;
};

const validateNotifyReference = (reference: unknown) => {
	if (typeof reference !== 'string' || !/^create-case:PLAN-\d+$/.test(reference)) {
		throw new Error('Expected a Notify reference like create-case:PLAN-123456');
	}

	return reference;
};

export const waitForNotifyEmailByReference = async ({ reference, templateId }: NotifyEmailLookupArgs) => {
	const notifyReference = validateNotifyReference(reference);
	const notifyClient = getNotifyClient();
	const timeoutMs = Number(process.env.CYPRESS_NOTIFY_SMOKE_TIMEOUT_MS || 60000);
	const intervalMs = Number(process.env.CYPRESS_NOTIFY_SMOKE_INTERVAL_MS || 5000);
	const startedAt = Date.now();
	let foundCount = 0;

	while (Date.now() - startedAt < timeoutMs) {
		const notifications = await notifyClient.getEmailNotificationsByReference(notifyReference);
		foundCount = notifications.length;
		const notification = notifications.find((item) => !templateId || item.template?.id === templateId);

		if (notification) {
			return {
				id: notification.id,
				reference: notification.reference,
				status: notification.status,
				templateId: notification.template?.id
			};
		}

		await delay(intervalMs);
	}

	throw new Error(
		`No Notify email found for reference "${notifyReference}" after ${timeoutMs}ms (${foundCount} found)`
	);
};
