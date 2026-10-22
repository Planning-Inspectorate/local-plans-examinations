import { loadConfig } from '../../app/config.ts';
import type { AuthSession } from '#util/cached-entra-client.ts';
import type { ManageService } from '#service';
import type { Request } from 'express';

export async function sendAssessorAppointedNotifyEmail(
	service: ManageService,
	req: Request,
	reference: string,
	assessorName: string
) {
	const config = loadConfig();

	const portalUrl = process.env.PORTAL_URL;
	const gw2AssessorTemplateId = config.govNotify.templateIds.gw2AssessorUpdatedAssessor;
	const gw2AssessorLpaTemplateId = config.govNotify.templateIds.gw2AssessorUpdatedLpa;

	if (!portalUrl) throw new Error('PORTAL_URL environment variable is not set');
	if (!gw2AssessorTemplateId)
		throw new Error('GOV_NOTIFY_GW2_ASSESSOR_UPDATED_ASSESSOR_TEMPLATE_ID environment variable is not set');
	if (!gw2AssessorLpaTemplateId)
		throw new Error('GOV_NOTIFY_GW2_ASSESSOR_UPDATED_LPA_TEMPLATE_ID environment variable is not set');

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

	const entraClient = service.getEntraClient(req.session as AuthSession)!;
	const allInspectors = await entraClient.listAllGroupMembers(service.entraGroupIds.inspectors ?? '');
	const inspectorId = allInspectors.find((inspector) => inspector.id === assessorName)?.id;
	const assessorEmail = await entraClient.getUserEmailFromId(inspectorId ?? '');
	const lpasToSendTo = [...new Set([...caseRecord!.contacts.map((contact) => contact.email)])];

	const portalLoginURL = `${portalUrl}/login`;
	const caseReference = reference;
	const notifyReference = `create-case:${caseReference}`;
	const personalisationDetails = {
		portalLoginURL,
		['plan_ref']: caseReference,
		['authority_name']: caseLpas?.join(', '),
		['plan_type']: caseRecord!.planType
			.split('-')
			.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' '),
		['contact_info']: service.localPlansTeamEmail,
		['team_email_address']: service.localPlansTeamEmail,
		['gw2_assessor_initial']: assessorName[0],
		['gw2_assessor_lastname']: assessorName.split(' ').slice(-1)[0],
		// TODO Where are we pulling the assessor's qualifications from
		['gw2_assessor_quals']: '',
		// TODO An assessor can be appointed without a workshhop
		['workshop_week_monday']: ''
	};

	try {
		await service.notifyClient?.sendEmail(gw2AssessorTemplateId, assessorEmail.trim(), {
			personalisation: personalisationDetails,
			reference: notifyReference
		});
		service.logger.info({ email: assessorEmail }, 'GW2 Assessor email sent');
	} catch (error) {
		service.logger.error({ error, email: assessorEmail }, 'Failed to send GW2 Assessor email');
	}

	// All LPAs notified
	await Promise.allSettled(
		lpasToSendTo.map(async (email) => {
			try {
				await service.notifyClient?.sendEmail(gw2AssessorLpaTemplateId, email.trim(), {
					personalisation: personalisationDetails,
					reference: notifyReference
				});
				service.logger.info({ email: email }, 'GW2 Assessor updated email sent to LPA');
			} catch (error) {
				service.logger.error({ error, email: email }, 'Failed to send GW2 Assessor updated email to LPA');
			}
		})
	);
}

export async function sendWorkshopDocsUploadedNotifyEmail(service: ManageService, req: Request, reference: string) {
	const config = loadConfig();

	const portalUrl = process.env.PORTAL_URL;
	const gw2WorkshopAgendaTemplateId = config.govNotify.templateIds.gw2WorkshopAgenda;

	if (!portalUrl) throw new Error('PORTAL_URL environment variable is not set');
	if (!gw2WorkshopAgendaTemplateId)
		throw new Error('GOV_NOTIFY_GW2_WORKSHOP_AGENDA_TEMPLATE_ID environment variable is not set');

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
	const lpasToSendTo = [...new Set([...caseRecord!.contacts.map((contact) => contact.email)])];

	const portalLoginURL = `${portalUrl}/login`;
	const caseReference = reference;
	const notifyReference = `create-case:${caseReference}`;
	const personalisationDetails = {
		portalLoginURL,
		['plan_ref']: caseReference,
		['authority_name']: caseLpas?.join(', '),
		['plan_type']: caseRecord!.planType
			.split('-')
			.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' '),
		['contact_info']: service.localPlansTeamEmail,
		['team_email_address']: service.localPlansTeamEmail
		// TODO Confirm usage of params in template
	};

	// All LPAs notified
	await Promise.allSettled(
		lpasToSendTo.map(async (email) => {
			try {
				await service.notifyClient?.sendEmail(gw2WorkshopAgendaTemplateId, email.trim(), {
					personalisation: personalisationDetails,
					reference: notifyReference
				});
				service.logger.info({ email: email }, 'GW2 workshop agenda email sent');
			} catch (error) {
				service.logger.error({ error, email: email }, 'Failed to send GW2 workshop agenda email to LPA');
			}
		})
	);
}

export async function sendWorkshopReportUploadedNotifyEmail(service: ManageService, req: Request, reference: string) {
	const config = loadConfig();

	const portalUrl = process.env.PORTAL_URL;
	const gw2ReportUploadedTemplateId = config.govNotify.templateIds.gw2ReportUploaded;

	if (!portalUrl) throw new Error('PORTAL_URL environment variable is not set');
	if (!gw2ReportUploadedTemplateId)
		throw new Error('GOV_NOTIFY_GW2_REPORT_UPLOADED_TEMPLATE_ID environment variable is not set');

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
	const lpasToSendTo = [...new Set([...caseRecord!.contacts.map((contact) => contact.email)])];

	const portalLoginURL = `${portalUrl}/login`;
	const caseReference = reference;
	const notifyReference = `create-case:${caseReference}`;
	const personalisationDetails = {
		portalLoginURL,
		['plan_ref']: caseReference,
		['authority_name']: caseLpas?.join(', '),
		['plan_type']: caseRecord!.planType
			.split('-')
			.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' '),
		['contact_info']: service.localPlansTeamEmail,
		['team_email_address']: service.localPlansTeamEmail
		// TODO Confirm usage of params in template
	};

	// All LPAs notified
	await Promise.allSettled(
		lpasToSendTo.map(async (email) => {
			try {
				await service.notifyClient?.sendEmail(gw2ReportUploadedTemplateId, email.trim(), {
					personalisation: personalisationDetails,
					reference: notifyReference
				});
				service.logger.info({ email: email }, 'GW2 report uploaded email sent');
			} catch (error) {
				service.logger.error({ error, email: email }, 'Failed to send GW2 report uploaded email to LPA');
			}
		})
	);
}
