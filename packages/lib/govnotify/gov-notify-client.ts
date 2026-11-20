import { NotifyClient } from 'notifications-node-client';
import type { Logger } from 'pino';
import { describeNotifyError } from './notify-error.ts';
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

	async sendAuthCode(email: string, personalisation: AuthCodePersonalisation, reference?: string): Promise<void> {
		const templateId = this.#templateIds.authCode;
		if (!templateId) {
			// fail before calling Notify, so the logs name the missing setting instead of a Notify 400
			const message = 'GOV_NOTIFY_AUTH_CODE_TEMPLATE_ID is not set';
			this.logger.error(`${message} - cannot send auth code email`);
			throw new Error(`email failed to dispatch: ${message}`);
		}
		await this.sendEmail(templateId, email, {
			personalisation,
			...(reference && { reference })
		});
	}

	/**
	 * Send an email once. Any failure is logged with the Notify status and a hint, then thrown - no retries.
	 */
	async sendEmail(templateId: string, emailAddress: string, options: GovNotifyOptions): Promise<void> {
		try {
			this.logger.info(`dispatching email template: ${templateId}`);
			await this.notifyClient.sendEmail(templateId, emailAddress, options);
		} catch (error) {
			const { status, notifyErrors, hint } = describeNotifyError(error);
			const message = error instanceof Error ? error.message : String(error);
			this.logger.error({ error, templateId, status, hint }, 'failed to dispatch email');
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
