declare module 'notifications-node-client' {
	export class NotifyClient {
		constructor(apiKey: string);
		sendEmail(templateId: string, emailAddress: string, options: object): Promise<unknown>;
		getNotificationById(notificationId: string): Promise<{ data: unknown }>;
	}
}

export interface GovNotifyOptions {
	personalisation: Record<string, string>;
	reference?: string;
}

export interface TemplateIds {
	caseAssignment: string;
	caseUpdate: string;
	authCode: string;
}

export interface NotifyConfig {
	disabled: boolean;
	apiKey: string;
	webHookToken?: string;
	templateIds: Partial<TemplateIds>;
}

export interface CaseAssignmentPersonalisation {
	reference: string;
	caseName: string;
	frontOfficeLink: string;
	assignedUserName: string;
}

export interface CaseUpdatePersonalisation {
	reference: string;
	caseName: string;
	updateDescription: string;
	frontOfficeLink: string;
}

export interface AuthCodePersonalisation {
	authCode: string;
	expiryMinutes: string;
}
