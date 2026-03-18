import { NotifyClient } from 'notifications-node-client';
import type { Logger } from 'pino';
import type {
	GovNotifyOptions,
	TemplateIds,
	CaseAssignmentPersonalisation,
	CaseUpdatePersonalisation,
	AuthCodePersonalisation
} from './types.ts';

export class GovNotifyClient {
	readonly notifyClient: NotifyClient;
	#templateIds: Partial<TemplateIds>;
	logger: Logger;

	constructor(logger: Logger, apiKey: string, templateIds: Partial<TemplateIds>) {
		this.logger = logger;
		this.notifyClient = new NotifyClient(apiKey);
		this.#templateIds = templateIds;
	}

	async sendCaseAssignment(email: string, personalisation: CaseAssignmentPersonalisation): Promise<void> {
		await this.sendEmail(this.#templateIds.caseAssignment!, email, {
			personalisation,
			reference: personalisation.reference
		});
	}

	async sendCaseUpdate(email: string, personalisation: CaseUpdatePersonalisation): Promise<void> {
		await this.sendEmail(this.#templateIds.caseUpdate!, email, {
			personalisation,
			reference: personalisation.reference
		});
	}

	async sendAuthCode(email: string, personalisation: AuthCodePersonalisation): Promise<void> {
		await this.sendEmail(this.#templateIds.authCode!, email, { personalisation });
	}

	async sendEmail(templateId: string, emailAddress: string, options: GovNotifyOptions): Promise<void> {
		try {
			this.logger.info(`dispatching email template: ${templateId}`);
			await this.notifyClient.sendEmail(templateId, emailAddress, options);
		} catch (error: any) {
			this.logger.error({ error, templateId }, 'failed to dispatch email');
			if (error.response?.data?.errors) {
				this.logger.error({ message: error.response.data.errors }, 'received from Notify API');
			}
			throw new Error(`email failed to dispatch: ${error.message}`, { cause: error });
		}
	}

	async getNotificationById(notificationId: string): Promise<{ data: any }> {
		try {
			this.logger.info(`fetching notification by ID: ${notificationId}`);
			return (await this.notifyClient.getNotificationById(notificationId)) as { data: any };
		} catch (error: any) {
			this.logger.error({ error, notificationId }, 'failed to fetch notification by ID');
			throw new Error(`failed to fetch notification: ${error.message}`, { cause: error });
		}
	}
}
