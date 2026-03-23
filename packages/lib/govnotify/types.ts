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
	[key: string]: string;
	reference: string;
	caseName: string;
	frontOfficeLink: string;
	assignedUserName: string;
}

export interface CaseUpdatePersonalisation {
	[key: string]: string;
	reference: string;
	caseName: string;
	updateDescription: string;
	frontOfficeLink: string;
}

export interface AuthCodePersonalisation {
	[key: string]: string;
	authCode: string;
	expiryMinutes: string;
}
