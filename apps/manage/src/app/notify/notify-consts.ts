import type { GovTemplateIdsKeys } from '../config.ts';

export type TemplateLogMessage = { emailSent: string; failedToSend: string };

export const TemplateLogMessages = {
	authCode: {
		emailSent: 'Auth code email sent',
		failedToSend: 'Failed to send auth code email'
	},
	gw2WorkshopInspector: {
		emailSent: 'Email sent to GW2 assessor for workshop set up',
		failedToSend: 'Failed to send workshop set up email'
	},
	gw2WorkshopLpa: {
		emailSent: 'Email sent to LPA for workshop set up',
		failedToSend: 'Failed to send workshop set up email'
	},
	gw2AssessorUpdatedAssessor: {
		emailSent: 'GW2 Assessor email sent',
		failedToSend: 'Failed to send GW2 Assessor email'
	},
	gw2AssessorUpdatedLpa: {
		emailSent: 'GW2 Assessor updated email sent to LPA',
		failedToSend: 'Failed to send GW2 Assessor updated email to LPA'
	},
	gw2WorkshopAgenda: {
		emailSent: 'GW2 workshop agenda email sent',
		failedToSend: 'Failed to send GW2 workshop agenda email to LPA'
	},
	gw2ReportUploaded: {
		emailSent: 'GW2 report uploaded email sent',
		failedToSend: 'Failed to send GW2 report uploaded email to LPA'
	},
	gw3AssessorUpdatedAssessor: {
		emailSent: 'GW3 Assessor updated email sent to assessor',
		failedToSend: 'Failed to send GW3 Assessor updated email to assessor'
	},
	gw3AssessorUpdatedLpa: {
		emailSent: 'GW3 Assessor updated email sent to LPA',
		failedToSend: 'Failed to send GW3 Assessor updated email to LPA'
	},
	gw3Pass: {
		emailSent: 'GW3 pass email sent',
		failedToSend: 'Failed to send GW3 pass email'
	},
	gw3ResubmissionRequired: {
		emailSent: 'GW3 resubmission required email sent',
		failedToSend: 'Failed to send GW3 resubmission required email'
	},
	appointedInspector: {
		emailSent: 'Appointed inspector email sent',
		failedToSend: 'Failed to send appointed inspector email'
	},
	appointedInspectorLpa: {
		emailSent: 'Appointed inspector email sent to LPA',
		failedToSend: 'Failed to send appointed inspector email to LPA'
	},
	examinationOutcomeSound: {
		emailSent: 'Examination outcome email sent',
		failedToSend: 'Failed to send examination outcome email'
	},
	examinationOutcomeUnsound: {
		emailSent: 'Examination outcome unsound email sent',
		failedToSend: 'Failed to send examination outcome unsound email'
	}
} satisfies Partial<Record<GovTemplateIdsKeys, TemplateLogMessage>>;
export type NotifyEmailTemplateKey = keyof typeof TemplateLogMessages;
