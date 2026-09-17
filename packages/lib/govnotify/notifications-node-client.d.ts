declare module 'notifications-node-client' {
	export class NotifyClient {
		constructor(apiKey: string);
		sendEmail(templateId: string, emailAddress: string, options: object): Promise<unknown>;
		getNotificationById(notificationId: string): Promise<{ data: unknown }>;
		getNotifications(
			templateType?: string,
			status?: string,
			reference?: string,
			olderThanId?: string
		): Promise<{
			data: {
				notifications?: Array<{
					id: string;
					reference?: string;
					status?: string;
					template?: {
						id?: string;
					};
				}>;
			};
		}>;
	}
}
