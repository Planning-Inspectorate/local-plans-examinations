import { loadGovNotifyConfig } from '../../app/config.ts';
import type { AuthSession } from '#util/cached-entra-client.ts';
import type { ManageService } from '#service';
import type { Request } from 'express';

export async function sendGw2WorkshopSetUpNotifyEmail(
	service: ManageService,
	req: Request,
	reference: string,
	answers: Record<string, any>
) {
	if (!service.notifyClient) {
		service.logger.warn('Notify client not configured');
	} else {
		const config = loadGovNotifyConfig();
		if (config.disabled) return;

		const portalUrl = process.env.PORTAL_URL;
		const workshopInspectorTemplateId = config.templateIds.gw2WorkshopInspector;
		const workshopLpaTemplateId = config.templateIds.gw2WorkshopLpa;

		if (!portalUrl) throw new Error('PORTAL_URL environment variable is not set');
		if (!workshopInspectorTemplateId)
			throw new Error('GOV_NOTIFY_GW2_WORKSHOP_INSPECTOR_TEMPLATE_ID environment variable is not set');
		if (!workshopLpaTemplateId)
			throw new Error('GOV_NOTIFY_GW2_WORKSHOP_LPA_TEMPLATE_ID environment variable is not set');

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
		const gw2Info = await service.db.gateway2Info.findUnique({
			where: { caseId: caseRecord?.id }
		});

		const workshopCount = (answers.workshops as []).length;

		const workshopStartDate = answers[`workshopDate-${workshopCount}`];
		const workshopEndDate = answers[`workshopEndDate-${workshopCount}`];
		const workshopType = answers[`workshopLocationType-${workshopCount}`];

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
			['contact_info']: 'If you need to contact us, call 0303 444 5000',
			['team_email_address']: service.localPlansTeamEmail,
			['workshop_start_date']: workshopStartDate,
			['workshop_end_date']: workshopEndDate ? workshopEndDate : '',
			['workshop_type']: workshopType,
			['if_workshop_online']: workshopType === 'remote' ? 'yes' : 'no',
			['if_workshop_in-person']: workshopType === 'in-person' ? 'yes' : 'no'
		};

		const entraClient = service.getEntraClient(req.session as AuthSession)!;
		const allInspectors = await entraClient.listAllGroupMembers(service.entraGroupIds.inspectors ?? '');
		const inspectorId = allInspectors.find((inspector) => inspector.id === gw2Info?.assessorName)?.id;
		const assessorEmail = await entraClient.getUserEmailFromId(inspectorId ?? '');
		const lpasToSendTo = [...new Set([...caseRecord!.contacts.map((contact) => contact.email)])];

		// Notify the GW2 assessor (aka inspector)
		try {
			await service.notifyClient?.sendEmail(workshopInspectorTemplateId, assessorEmail.trim(), {
				personalisation: personalisationDetails,
				reference: notifyReference
			});
			service.logger.info({ email: assessorEmail }, 'Email sent to GW2 assessor for workshop set up');
		} catch (error) {
			service.logger.error({ error, email: assessorEmail }, 'Failed to send workshop set up email');
		}

		// All LPAs notified
		await Promise.allSettled(
			lpasToSendTo.map(async (email) => {
				try {
					await service.notifyClient?.sendEmail(workshopLpaTemplateId, email.trim(), {
						personalisation: personalisationDetails,
						reference: notifyReference
					});
					service.logger.info({ email: email }, 'Email sent to LPA for workshop set up');
				} catch (error) {
					service.logger.error({ error, email: email }, 'Failed to send workshop set up email');
				}
			})
		);
	}
}

export async function sendGw2AssessorAppointedNotifyEmail(
	service: ManageService,
	req: Request,
	reference: string,
	assessorName: string
) {
	if (!service.notifyClient) {
		service.logger.warn('Notify client not configured');
	} else {
		const config = loadGovNotifyConfig();
		if (config.disabled) return;

		const portalUrl = process.env.PORTAL_URL;
		const gw2AssessorTemplateId = config.templateIds.gw2AssessorUpdatedAssessor;
		const gw2AssessorLpaTemplateId = config.templateIds.gw2AssessorUpdatedLpa;

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
		const gw2Info = await service.db.gateway2Info.findUnique({
			where: { caseId: caseRecord?.id }
		});

		const caseLpas = caseRecord?.lpas.map((lpa) => lpa.lpaName) ?? [];

		const entraClient = service.getEntraClient(req.session as AuthSession)!;
		const allInspectors = await entraClient.listAllGroupMembers(service.entraGroupIds.inspectors ?? '');
		const inspectorId = allInspectors.find((inspector) => inspector.id === assessorName)?.id;
		const assessorEmail = await entraClient.getUserEmailFromId(inspectorId ?? '');
		const lpasToSendTo = [...new Set([...caseRecord!.contacts.map((contact) => contact.email)])];

		const mondayAfterSubmissionPlusTwoWeeks = new Date(gw2Info?.actualDate?.getDate() ?? Date.now());
		mondayAfterSubmissionPlusTwoWeeks.setDate(mondayAfterSubmissionPlusTwoWeeks.getDate() + 14);
		mondayAfterSubmissionPlusTwoWeeks.setDate(
			mondayAfterSubmissionPlusTwoWeeks.getDate() + ((1 + 7 - mondayAfterSubmissionPlusTwoWeeks.getDay()) % 7)
		);

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
			['team_email_address']: service.localPlansTeamEmail,
			['gw2_assessor_initial']: assessorName[0],
			['gw2_assessor_lastname']: assessorName.split(' ').slice(-1)[0],
			['workshop_week_monday']: mondayAfterSubmissionPlusTwoWeeks.toISOString().split('T')[0],
			['contact_info']: 'If you need to contact us, call 0303 444 5000'
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
}

export async function sendWorkshopDocsUploadedNotifyEmail(service: ManageService, req: Request, reference: string) {
	if (!service.notifyClient) {
		service.logger.warn('Notify client not configured');
	} else {
		const config = loadGovNotifyConfig();
		if (config.disabled) return;

		const portalUrl = process.env.PORTAL_URL;
		const gw2WorkshopAgendaTemplateId = config.templateIds.gw2WorkshopAgenda;

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
			['team_email_address']: service.localPlansTeamEmail,
			['contact_info']: 'If you need to contact us, call 0303 444 5000'
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
}

export async function sendWorkshopReportUploadedNotifyEmail(service: ManageService, req: Request, reference: string) {
	if (!service.notifyClient) {
		service.logger.warn('Notify client not configured');
	} else {
		const config = loadGovNotifyConfig();
		if (config.disabled) return;

		const portalUrl = process.env.PORTAL_URL;
		const gw2ReportUploadedTemplateId = config.templateIds.gw2ReportUploaded;

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
			['team_email_address']: service.localPlansTeamEmail,
			['contact_info']: 'If you need to contact us, call 0303 444 5000'
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
}

export async function sendGw3AssessorAppointedNotifyEmail(
	service: ManageService,
	req: Request,
	reference: string,
	assessorName: string
) {
	if (!service.notifyClient) {
		service.logger.warn('Notify client not configured');
	} else {
		const config = loadGovNotifyConfig();
		if (config.disabled) return;

		const portalUrl = process.env.PORTAL_URL;
		const gw3AssessorAppointedTemplateId = config.templateIds.gw3AssessorUpdatedAssessor;
		const gw3AssessorAppointedLpaTemplateId = config.templateIds.gw3AssessorUpdatedLpa;

		if (!portalUrl) throw new Error('PORTAL_URL environment variable is not set');
		if (!gw3AssessorAppointedTemplateId)
			throw new Error('GOV_NOTIFY_GW3_ASSESSOR_UPDATED_ASSESSOR_TEMPLATE_ID environment variable is not set');
		if (!gw3AssessorAppointedLpaTemplateId)
			throw new Error('GOV_NOTIFY_GW3_ASSESSOR_UPDATED_LPA_TEMPLATE_ID environment variable is not set');

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
			['team_email_address']: service.localPlansTeamEmail,
			['contact_info']: 'If you need to contact us, call 0303 444 5000',
			['gw3_assessor_initial']: assessorName[0],
			['gw3_assessor_lastname']: assessorName.split(' ').slice(-1)[0]
		};

		// Send to assessor
		try {
			await service.notifyClient?.sendEmail(gw3AssessorAppointedTemplateId, assessorEmail.trim(), {
				personalisation: personalisationDetails,
				reference: notifyReference
			});
			service.logger.info({ email: assessorEmail }, 'GW3 Assessor email sent');
		} catch (error) {
			service.logger.error({ error, email: assessorEmail }, 'Failed to send GW3 Assessor email');
		}

		// All LPAs notified
		await Promise.allSettled(
			lpasToSendTo.map(async (email) => {
				try {
					await service.notifyClient?.sendEmail(gw3AssessorAppointedLpaTemplateId, email.trim(), {
						personalisation: personalisationDetails,
						reference: notifyReference
					});
					service.logger.info({ email: email }, 'GW3 assessor appointed email sent');
				} catch (error) {
					service.logger.error({ error, email: email }, 'Failed to send GW3 assessor appointed email to LPA');
				}
			})
		);
	}
}

export async function sendGw3PassNotifyEmail(service: ManageService, req: Request, reference: string) {
	if (!service.notifyClient) {
		service.logger.warn('Notify client not configured');
	} else {
		const config = loadGovNotifyConfig();
		if (config.disabled) return;

		const portalUrl = process.env.PORTAL_URL;
		const gw3PassTemplateId = config.templateIds.gw3Pass;

		if (!portalUrl) throw new Error('PORTAL_URL environment variable is not set');
		if (!gw3PassTemplateId) throw new Error('GOV_NOTIFY_GW3_PASS_TEMPLATE_ID environment variable is not set');

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
			['team_email_address']: service.localPlansTeamEmail,
			['contact_info']: 'If you need to contact us, call 0303 444 5000'
		};

		// All LPAs notified
		await Promise.allSettled(
			lpasToSendTo.map(async (email) => {
				try {
					await service.notifyClient?.sendEmail(gw3PassTemplateId, email.trim(), {
						personalisation: personalisationDetails,
						reference: notifyReference
					});
					service.logger.info({ email: email }, 'GW3 pass email sent');
				} catch (error) {
					service.logger.error({ error, email: email }, 'Failed to send GW3 pass email to LPA');
				}
			})
		);
	}
}

export async function sendGw3ResubmissionNeededNotifyEmail(service: ManageService, req: Request, reference: string) {
	if (!service.notifyClient) {
		service.logger.warn('Notify client not configured');
	} else {
		const config = loadGovNotifyConfig();
		if (config.disabled) return;

		const portalUrl = process.env.PORTAL_URL;
		const gw3ResubmissionRequiredTemplateId = config.templateIds.gw3ResubmissionRequired;

		if (!portalUrl) throw new Error('PORTAL_URL environment variable is not set');
		if (!gw3ResubmissionRequiredTemplateId)
			throw new Error('GOV_NOTIFY_GW3_RESUBMISSION_REQUIRED_TEMPLATE_ID environment variable is not set');

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
			['team_email_address']: service.localPlansTeamEmail,
			['contact_info']: 'If you need to contact us, call 0303 444 5000'
		};

		// All LPAs notified
		await Promise.allSettled(
			lpasToSendTo.map(async (email) => {
				try {
					await service.notifyClient?.sendEmail(gw3ResubmissionRequiredTemplateId, email.trim(), {
						personalisation: personalisationDetails,
						reference: notifyReference
					});
					service.logger.info({ email: email }, 'GW3 resubmission needed email sent');
				} catch (error) {
					service.logger.error({ error, email: email }, 'Failed to send GW3 resubmission needed email to LPA');
				}
			})
		);
	}
}
