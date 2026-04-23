import type { Logger } from 'pino';
import { GovNotifyClient } from './gov-notify-client.ts';
import type { NotifyConfig } from './types.ts';
import { NotifyEmailStatus } from './notify-email-status.ts';

export { GovNotifyClient, NotifyEmailStatus };
export type { NotifyConfig };

export function initGovNotify(config: NotifyConfig, logger: Logger): GovNotifyClient | null {
	if (config.disabled) {
		logger.info('Gov Notify is disabled');
		return null;
	}
	if (!config.apiKey) {
		logger.warn('GOV_NOTIFY_API_KEY is not set — Gov Notify will not send emails');
		return null;
	}
	return new GovNotifyClient(logger, config.apiKey, config.templateIds);
}
