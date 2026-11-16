import { type GovTemplateIdsKeys, loadGovNotifyConfig } from '../config.ts';
import type { AuthSession } from '#util/cached-entra-client.ts';
import type { ManageService } from '#service';
import type { Request } from 'express';

type TemplateLogMessage = { emailSent: string; failedToSend: string };

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
	appointedInspectorNotifyId: {
		emailSent: 'Appointed inspector email sent',
		failedToSend: 'Failed to send appointed inspector email'
	},
	examinationOutcomeSoundId: {
		emailSent: 'Examination outcome email sent',
		failedToSend: 'Failed to send examination outcome email'
	},
	examinationOutcomeUnsoundId: {
		emailSent: 'Examination outcome unsound email sent',
		failedToSend: 'Failed to send examination outcome unsound email'
	}
} satisfies Partial<Record<GovTemplateIdsKeys, TemplateLogMessage>>;
export type NotifyEmailTemplateKey = keyof typeof TemplateLogMessages;

export interface SendNotifyEmailOptions {
	recipients?: string[];
	personalisation?: Record<string, any>;
}

/**
 * Returns the Gov Notify config when emails can be sent, otherwise null.
 * Logs a warning when the client is missing; stays silent when Notify is disabled.
 */
function getNotifyConfig(service: ManageService) {
	if (!service.notifyClient) {
		service.logger.warn('Notify client not configured');
		return null;
	}
	const config = loadGovNotifyConfig();
	return config.disabled ? null : config;
}

function templateEnvVarName(templateKey: GovTemplateIdsKeys): string {
	const snakeCase = templateKey.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
	return `GOV_NOTIFY_${snakeCase}_TEMPLATE_ID`;
}

async function getGw2Info(service: ManageService, reference: string) {
	const caseRecord = await service.db.case.findUnique({
		where: { reference },
		select: { id: true }
	});
	return service.db.gateway2Info.findUnique({
		where: { caseId: caseRecord?.id }
	});
}

async function getAssessorEmail(service: ManageService, req: Request, assessorId: string | null | undefined) {
	const entraClient = service.getEntraClient(req.session as AuthSession)!;
	const allInspectors = await entraClient.listAllGroupMembers(service.entraGroupIds.inspectors ?? '');
	const inspectorId = allInspectors.find((inspector) => inspector.id === assessorId)?.id;
	return entraClient.getUserEmailFromId(inspectorId ?? '');
}

export const sendNotifyEmail = async (
	service: ManageService,
	reference: string,
	templateKey: NotifyEmailTemplateKey,
	options: SendNotifyEmailOptions = {}
) => {
	const config = getNotifyConfig(service);
	if (!config) return;
	if (config?.disabled) return;

	const portalUrl = process.env.PORTAL_URL;
	const templateId = config.templateIds[templateKey];
	if (!portalUrl) throw new Error('PORTAL_URL environment variable is not set');
	if (!templateId) throw new Error(`${templateEnvVarName(templateKey)} environment variable is not set`);

	const caseRecord = await service.db.case.findUnique({
		where: { reference },
		select: {
			id: true,
			lpas: true,
			planType: true,
			contacts: true
		}
	});
	const caseLpas = caseRecord?.lpas.map((lpa) => lpa.lpaName) ?? [];
	const recipients = options.recipients ?? [...new Set(caseRecord!.contacts.map((contact) => contact.email))];

	const notifyReference = `create-case:${reference}`;
	const personalisationDetails = {
		portalLoginURL: `${portalUrl}/login`,
		['plan_ref']: reference,
		['authority_name']: caseLpas.join(', '),
		['plan_type']: caseRecord!.planType
			.split('-')
			.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' '),
		['team_email_address']: service.localPlansTeamEmail,
		['contact_info']: 'If you need to contact us, call 0303 444 5000',
		...options.personalisation
	};

	const { emailSent, failedToSend } = TemplateLogMessages[templateKey];

	await Promise.allSettled(
		recipients.map(async (email) => {
			try {
				await service.notifyClient?.sendEmail(templateId, email.trim(), {
					personalisation: personalisationDetails,
					reference: notifyReference
				});
				service.logger.info({ email }, emailSent);
			} catch (error) {
				service.logger.error({ error, email }, failedToSend);
			}
		})
	);
};

export async function sendGw2WorkshopSetUpNotifyEmail(
	service: ManageService,
	req: Request,
	reference: string,
	answers: Record<string, any>
) {
	if (!getNotifyConfig(service)) return;

	const workshopCount = (answers.workshops as []).length;
	const workshopEndDate = answers[`workshopEndDate-${workshopCount}`];
	const workshopType = answers[`workshopLocationType-${workshopCount}`];
	const personalisation = {
		['workshop_start_date']: answers[`workshopDate-${workshopCount}`],
		['workshop_end_date']: workshopEndDate ? workshopEndDate : '',
		['workshop_type']: workshopType,
		['if_workshop_online']: workshopType === 'remote' ? 'yes' : 'no',
		['if_workshop_in-person']: workshopType === 'in-person' ? 'yes' : 'no'
	};

	const gw2Info = await getGw2Info(service, reference);
	const assessorEmail = await getAssessorEmail(service, req, gw2Info?.assessorName);

	// Notify the GW2 assessor (aka inspector)
	await sendNotifyEmail(service, reference, 'gw2WorkshopInspector', {
		recipients: [assessorEmail],
		personalisation
	});
	// All LPAs notified
	await sendNotifyEmail(service, reference, 'gw2WorkshopLpa', { personalisation });
}

export async function sendGw2AssessorAppointedNotifyEmail(
	service: ManageService,
	req: Request,
	reference: string,
	assessorName: string
) {
	if (!getNotifyConfig(service)) return;

	const gw2Info = await getGw2Info(service, reference);
	const assessorEmail = await getAssessorEmail(service, req, assessorName);

	const mondayAfterSubmissionPlusTwoWeeks = new Date(gw2Info?.actualDate?.getDate() ?? Date.now());
	mondayAfterSubmissionPlusTwoWeeks.setDate(mondayAfterSubmissionPlusTwoWeeks.getDate() + 14);
	mondayAfterSubmissionPlusTwoWeeks.setDate(
		mondayAfterSubmissionPlusTwoWeeks.getDate() + ((1 + 7 - mondayAfterSubmissionPlusTwoWeeks.getDay()) % 7)
	);

	const personalisation = {
		['gw2_assessor_initial']: assessorName[0],
		['gw2_assessor_lastname']: assessorName.split(' ').slice(-1)[0],
		['workshop_week_monday']: mondayAfterSubmissionPlusTwoWeeks.toISOString().split('T')[0]
	};

	await sendNotifyEmail(service, reference, 'gw2AssessorUpdatedAssessor', {
		recipients: [assessorEmail],
		personalisation
	});
	// All LPAs notified
	await sendNotifyEmail(service, reference, 'gw2AssessorUpdatedLpa', { personalisation });
}

export async function sendWorkshopDocsUploadedNotifyEmail(service: ManageService, req: Request, reference: string) {
	await sendNotifyEmail(service, reference, 'gw2WorkshopAgenda');
}

export async function sendWorkshopReportUploadedNotifyEmail(service: ManageService, req: Request, reference: string) {
	await sendNotifyEmail(service, reference, 'gw2ReportUploaded');
}

export async function sendGw3AssessorAppointedNotifyEmail(
	service: ManageService,
	req: Request,
	reference: string,
	assessorName: string
) {
	if (!getNotifyConfig(service)) return;

	const assessorEmail = await getAssessorEmail(service, req, assessorName);
	const personalisation = {
		['gw3_assessor_initial']: assessorName[0],
		['gw3_assessor_lastname']: assessorName.split(' ').slice(-1)[0]
	};

	// Send to assessor
	await sendNotifyEmail(service, reference, 'gw3AssessorUpdatedAssessor', {
		recipients: [assessorEmail],
		personalisation
	});
	// All LPAs notified
	await sendNotifyEmail(service, reference, 'gw3AssessorUpdatedLpa', { personalisation });
}

export async function sendGw3PassNotifyEmail(service: ManageService, req: Request, reference: string) {
	await sendNotifyEmail(service, reference, 'gw3Pass');
}

export async function sendGw3ResubmissionNeededNotifyEmail(service: ManageService, req: Request, reference: string) {
	await sendNotifyEmail(service, reference, 'gw3ResubmissionRequired');
}
