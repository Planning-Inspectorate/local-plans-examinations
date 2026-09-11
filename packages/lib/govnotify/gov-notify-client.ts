import { NotifyClient } from 'notifications-node-client';
import type { Logger } from 'pino';
import type { GovNotifyOptions, TemplateIds, AuthCodePersonalisation, NotifyEmail } from './types.ts';

type NotifyEmailListResponse = {
	data: {
		notifications?: NotifyEmail[];
	};
};

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
			const status = error instanceof Error ? (error as any).response?.status : undefined;
			const notifyErrors = error instanceof Error ? (error as any).response?.data?.errors : undefined;
			this.logger.error({ message, status, templateId }, 'failed to dispatch email');
			if (notifyErrors) {
				this.logger.error({ message: notifyErrors }, 'received from Notify API');
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

	async getEmailNotificationsByReference(reference: string): Promise<NotifyEmail[]> {
		try {
			this.logger.info(`fetching email notifications by reference: ${reference}`);
			const response = (await this.notifyClient.getNotifications(
				'email',
				undefined,
				reference
			)) as NotifyEmailListResponse;

			return response.data.notifications ?? [];
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.logger.error({ error, reference }, 'failed to fetch email notifications by reference');
			throw new Error(`failed to fetch email notifications: ${message}`, {
				cause: error
			});
		}
	}
}
