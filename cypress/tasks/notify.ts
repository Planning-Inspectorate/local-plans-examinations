import { setTimeout as delay } from 'node:timers/promises';
import type { Logger } from 'pino';
import { GovNotifyClient } from '../../packages/lib/govnotify/gov-notify-client.ts';

type NotifyEmailLookupArgs = {
	reference: string;
	templateId?: string;
};

type NotifyEmailsLookupArgs = {
	notifications: NotifyEmailLookupArgs[];
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
	if (typeof reference !== 'string' || !/^(create-case|portal-login|gateway-2-submission):PLAN-\d+$/.test(reference)) {
		throw new Error('Expected a supported Notify reference ending in a case reference like PLAN-123456');
	}

	return reference;
};

export const waitForNotifyEmailByReference = async ({ reference, templateId }: NotifyEmailLookupArgs) => {
	const [notification] = await waitForNotifyEmailsByReference({
		notifications: [{ reference, templateId }]
	});
	return notification;
};

export const waitForNotifyEmailsByReference = async ({ notifications }: NotifyEmailsLookupArgs) => {
	if (!Array.isArray(notifications) || notifications.length === 0) {
		throw new Error('At least one Notify email expectation is required');
	}

	const expectations = notifications.map(({ reference, templateId }) => ({
		reference: validateNotifyReference(reference),
		templateId
	}));
	const notifyClient = getNotifyClient();
	const timeoutMs = Number(process.env.CYPRESS_NOTIFY_SMOKE_TIMEOUT_MS || 720000);
	const intervalMs = Number(process.env.CYPRESS_NOTIFY_SMOKE_INTERVAL_MS || 10000);
	const startedAt = Date.now();
	const foundCounts = new Map<string, number>();

	while (Date.now() - startedAt < timeoutMs) {
		const matches = await Promise.all(
			expectations.map(async ({ reference, templateId }) => {
				const results = await notifyClient.getEmailNotificationsByReference(reference);
				foundCounts.set(reference, results.length);
				return results.find((item) => !templateId || item.template?.id === templateId);
			})
		);

		if (matches.every(Boolean)) {
			return matches.map((notification) => ({
				id: notification!.id,
				reference: notification!.reference,
				status: notification!.status,
				templateId: notification!.template?.id
			}));
		}

		await delay(intervalMs);
	}

	const summary = expectations
		.map(({ reference }) => `${reference} (${foundCounts.get(reference) ?? 0} found)`)
		.join(', ');
	throw new Error(`Notify emails were not found after ${timeoutMs}ms: ${summary}`);
};
