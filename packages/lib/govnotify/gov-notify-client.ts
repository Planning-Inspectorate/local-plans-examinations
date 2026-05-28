import { NotifyClient } from 'notifications-node-client';
import type { Logger } from 'pino';
import type { GovNotifyOptions, TemplateIds, AuthCodePersonalisation } from './types.ts';

export class GovNotifyClient {
	readonly notifyClient: NotifyClient;
	#templateIds: Partial<TemplateIds>;
	readonly logger: Logger;

	constructor(logger: Logger, apiKey: string, templateIds: Partial<TemplateIds>) {
		this.logger = logger;
		this.notifyClient = new NotifyClient(apiKey);
		this.#templateIds = templateIds;
	}

	async sendAuthCode(email: string, personalisation: AuthCodePersonalisation): Promise<void> {
		await this.sendEmail(this.#templateIds.authCode!, email, { personalisation });
	}

	async sendEmail(templateId: string, emailAddress: string, options: GovNotifyOptions): Promise<void> {
		try {
			this.logger.info(`dispatching email template: ${templateId}`);
			await this.notifyClient.sendEmail(templateId, emailAddress, options);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const hasNotifyErrors = error instanceof Error && (error as any).response?.data?.errors;
			this.logger.error({ error, templateId }, 'failed to dispatch email');
			if (hasNotifyErrors) {
				this.logger.error({ message: (error as any).response.data.errors }, 'received from Notify API');
			}
			throw new Error(`email failed to dispatch: ${message}`, { cause: error });
		}
	}

	async getNotificationById(notificationId: string): Promise<{ data: any }> {
		try {
			this.logger.info(`fetching notification by ID: ${notificationId}`);
			return (await this.notifyClient.getNotificationById(notificationId)) as { data: any };
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.logger.error({ error, notificationId }, 'failed to fetch notification by ID');
			throw new Error(`failed to fetch notification: ${message}`, {
				cause: error
			});
		}
	}
}
