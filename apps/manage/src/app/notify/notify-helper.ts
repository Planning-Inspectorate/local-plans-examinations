import { type GovTemplateIdsKeys, loadGovNotifyConfig } from '../config.ts';
import type { AuthSession } from '#util/cached-entra-client.ts';
import type { ManageService } from '#service';
import type { Request } from 'express';
import { getExaminingInspectorContacts } from '#util/util.ts';
import { getExaminingInspectorNames } from '../util/util.ts';
import { type NotifyEmailTemplateKey, TemplateLogMessages } from './notify-consts.ts';

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

/**
 * Extracts the useful parts of a Notify/Axios error without logging request headers (which contain the bearer token).
 */
function notifyErrorDetails(error: unknown) {
	const err = error as { message?: string; response?: { status?: number; data?: { errors?: unknown } } };
	return {
		message: err?.message,
		status: err?.response?.status,
		errors: err?.response?.data?.errors
	};
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
				service.logger.info({ email, templateKey }, emailSent);
			} catch (error) {
				service.logger.error({ email, templateKey, ...notifyErrorDetails(error) }, failedToSend);
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

type ExaminationEmailParams = {
	request?: Request & { session: AuthSession };
	personalisation?: Record<string, string>;
};

type ExaminationEmailHandler = (service: ManageService, reference: string) => Promise<void>;

type InspectorName = { firstName?: string | null; lastName?: string | null };

const INSPECTOR_SLOTS = ['lead_inspector', 'inspector2', 'inspector3', 'inspector4'] as const;

/**
 * Builds a mapping of inspector personalization fields for the configured inspector slots.
 *
 * @param inspectors - Inspectors used to populate each slot, defaulting to an empty list.
 * @return A record containing each slot's uppercase first-name initial and last name, with empty strings for missing values.
 */
function buildInspectorPersonalisation(inspectors: InspectorName[] = []): Record<string, string> {
	return Object.fromEntries(
		INSPECTOR_SLOTS.flatMap((slot, i) => [
			[`${slot}_initial`, inspectors[i]?.firstName?.charAt(0).toUpperCase() ?? ''],
			[`${slot}_lastname`, inspectors[i]?.lastName ?? '']
		])
	);
}

/**
 * Creates the email handler map used to send examination-related notification emails.
 *
 * @param params - The parameters used to configure the examination email handlers.
 * @param params.request - The request context required by handlers that need request-specific data.
 * @param params.personalisation - Additional personalisation values to include when sending notification emails.
 * @return A partial record of notification template keys mapped to their corresponding examination email handlers.
 */
function getExaminationEmailHandlers({
	request,
	personalisation = {}
}: ExaminationEmailParams): Partial<Record<NotifyEmailTemplateKey, ExaminationEmailHandler>> {
	return {
		appointedInspector: (service, reference) => {
			if (!request) {
				throw new Error('Request object is required for sending appointed inspector notify email');
			}
			return sendAppointedInspectorNotifyEmail(service, reference, request, personalisation);
		},

		appointedInspectorLpa: async (service, reference) => {
			if (!request) {
				throw new Error('Request object is required for sending LPA notify email');
			}
			const inspectors = await getExaminingInspectorNames(service, reference, request);
			return sendLPANotifications(service, reference, {
				...buildInspectorPersonalisation(inspectors),
				...personalisation
			});
		},
		examinationOutcomeSound: (service, reference) => sendSoundNotifyEmail(service, reference, personalisation),
		examinationOutcomeUnsound: (service, reference) => sendUnSoundNotifyEmail(service, reference, personalisation)
	};
}

export async function sendExaminationNotifyEmail(
	service: ManageService,
	reference: string,
	templateKey: NotifyEmailTemplateKey,
	params: ExaminationEmailParams = {}
) {
	try {
		await getExaminationEmailHandlers(params)[templateKey]?.(service, reference);
	} catch (error) {
		service.logger.error({ error, reference, templateKey }, 'Failed to send examination notify email');
	}
}

export async function sendAppointedInspectorNotifyEmail(
	service: ManageService,
	reference: string,
	req: Request & { session: AuthSession },
	personalisation?: Record<string, string>
) {
	const caseRecord = await service.db.case.findUnique({ where: { reference }, select: { id: true } });
	if (!caseRecord) {
		throw new Error(`Case not found for reference '${reference}'`);
	}
	const examInfo = await service.db.examinationInfo.findUnique({ where: { caseId: caseRecord.id } });
	const recipients = await getExaminingInspectorContacts(service, req, examInfo);
	await sendNotifyEmail(service, reference, 'appointedInspector', {
		recipients,
		personalisation
	});
}

export async function sendLPANotifications(
	service: ManageService,
	reference: string,
	personalisation?: Record<string, string>
) {
	await sendNotifyEmail(service, reference, 'appointedInspectorLpa', { personalisation });
}

export async function sendSoundNotifyEmail(
	service: ManageService,
	reference: string,
	personalisation?: Record<string, string>
) {
	await sendNotifyEmail(service, reference, 'examinationOutcomeSound', { personalisation });
}

export async function sendUnSoundNotifyEmail(
	service: ManageService,
	reference: string,
	personalisation?: Record<string, string>
) {
	await sendNotifyEmail(service, reference, 'examinationOutcomeUnsound', { personalisation });
}
