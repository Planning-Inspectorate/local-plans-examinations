import type { BaseService } from '@planning-inspectorate/core/app';
import type { Contact, PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import type { Schemas } from '@planning-inspectorate/data-model';

export class ODWDataMapper {
	#service: BaseService<PrismaClient>;
	#VALID_PLAN_TYPES = ['local_plans', 'other'];
	#VALID_PLAN_BANDS = [1, 2, 3];
	#VALID_EXAM_OUTCOMES = ['Sound', 'Unsound'];
	#VALID_LOCATION_TYPES = ['in_person', 'hybrid', 'virtual'];

	constructor(service: BaseService<PrismaClient>) {
		this.#service = service;
	}

	private validateField(value: any, allowedValues: any[]) {
		if (!allowedValues.includes(value)) {
			throw Error();
		}
		return value;
	}

	private formatYesNoField(value: string | null | undefined) {
		if (!value) {
			return null;
		}
		const valueLowerCase = value.toLowerCase();
		if (!(valueLowerCase == 'yes' || valueLowerCase == 'no')) {
			throw Error();
		}
		return valueLowerCase == 'yes';
	}

	private formatContact(contact: Contact): Schemas.Contact {
		return {
			contactId: contact.id,
			firstName: contact.firstName,
			lastName: contact.lastName,
			emailAddress: contact.email,
			phone: contact.phoneNumber,
			pinsLpaCode: contact.lpaCode,
			startDate: '', // DISCREPANCY: local plans does not store start/end dates for contacts/lpas
			endDate: null // DISCREPANCY: local plans does not store start/end dates for contacts/lpas
		};
	}

	private formatInspector(): Schemas.Inspector {
		return {
			entraId: '', // We identify some assessors by name rather than entraid - i need to confirm if all of these people have entra accounts before we switch on our side
			appointmentDate: '', // This is stored for all inspectors, rather than individual inspectors
			endDate: '' // This is stored for all inspectors, rather than individual inspectors
		};
	}

	public async mapPlanCase(caseId: string): Promise<Schemas.LocalPlansCase> {
		const allData = await this.#service.db.case.findUnique({
			where: {
				id: caseId
			},
			include: {
				gateway1Info: true,
				gateway2Info: true,
				gateway3Info: true,
				examinationInfo: true,
				contacts: true,
				lpas: true
			}
		});
		if (!allData) {
			throw Error();
		}
		return {
			id: caseId,
			caseReference: allData.reference,
			planTitle: allData.planTitle,
			planType: this.validateField(allData.planType, this.#VALID_PLAN_TYPES),
			planBand: this.validateField(allData.planBand, this.#VALID_PLAN_BANDS),
			caseOfficerId: [allData.caseOfficer], // todo data model needs to be extended to support multiple case officers
			lpaId: allData.lpas.map((lpa) => lpa.lpaCode),
			lpaContact: allData.contacts.map((contact) => this.formatContact(contact)),
			caseProgrammeOfficer: null, // DISCREPANCY: We store the programm officer's first/last names and email, and nothing else
			intentionToCommenceDate: allData.intentionToCommenceDate?.toISOString(),
			expectedSubmissionForExaminationDate:
				allData.examinationInfo?.expectedSubmissionForExaminationDate?.toISOString(),
			expectedPublicationDate: null, // todo need to check this
			createdDate: allData.createdAt.toISOString(),
			deletedDate: allData.deletedDate?.toISOString(),
			gateway1ExpectedDate: allData.gateway1Info?.expectedGateway1Date?.toISOString(),
			gateway1ActualDate: allData.gateway1Info?.completedGateway1Date?.toISOString(),
			slaSentDate: allData.gateway1Info?.slaSentDate?.toISOString(),
			slaReceivedDate: allData.gateway1Info?.slaReceivedDate?.toISOString(),
			dsaCurrentAndValid: this.formatYesNoField(allData.gateway1Info?.dsaChecked),
			gateway2ExpectedDate: allData.gateway2Info?.expectedDate?.toISOString(),
			gateway2ActualDate: allData.gateway2Info?.actualDate?.toISOString(),
			gateway2AssessorId: null, // Should be inspector, null for now while we fix the data model
			gateway2ReportIssuedDate: allData.gateway2Info?.reportIssuedDate?.toISOString(),
			reportPublishedByLpaDate: allData.gateway2Info?.reportPublishedByLPA?.toISOString(),
			workshopDocumentUploadedDate: allData.gateway2Info?.workshopDocumentUploadedDate?.toISOString(),
			gateway3ExpectedDate: allData.gateway3Info?.expectedDate?.toISOString(),
			gateway3ActualDate: allData.gateway3Info?.actualDate?.toISOString(),
			gateway3AssessorId: null, // Should be inspector, null for now while we fix the data model
			completionDate: null, // todo need to clarify
			actualSubmissionForExaminationDate: allData.examinationInfo?.submissionForExaminationDate?.toISOString(),
			examiningInspectorId: null, // Should be inspector, null for now while we fix the data model
			examinationWebsite: allData.examinationInfo?.examinationWebsite, // todo there are two fields to choose from
			letterSentToMHCLGDate: allData.examinationInfo?.letterSentToMHCLGDate?.toISOString(),
			letterIssueDate: allData.examinationInfo?.letterIssueDate?.toISOString(),
			qaDate: allData.examinationInfo?.QADate?.toISOString(),
			qaInspectorId: null, // Should be inspector, null for now while we fix the data model
			reportSentToPanelDate: allData.examinationInfo?.reportSentToPanelDate?.toISOString(),
			panelresponseToInspectorDate: allData.examinationInfo?.panelResponseToInspectorDate?.toISOString(),
			factCheckDateReceivedFromInspector: allData.examinationInfo?.factCheckDateReceivedFromInspector?.toISOString(),
			factCheckDueDate: allData.examinationInfo?.factCheckDueDate?.toISOString(),
			factCheckActualDate: allData.examinationInfo?.factCheckActualDate?.toISOString(),
			factCheckReceivedBackFromLPADate: allData.examinationInfo?.factCheckReceivedBackFromLPADate?.toISOString(),
			finalReportIssueDate: allData.examinationInfo?.finalReportIssueDate?.toISOString(),
			pauses: [],
			withdrawnDate: allData.examinationInfo?.withdrawnDate?.toISOString(),
			examinationOutcome: this.validateField(allData.examinationInfo?.isSound, this.#VALID_EXAM_OUTCOMES), // todo check conversion, there are also more outcomes now
			examinationOutcomeDate: allData.examinationInfo?.soundUnsoundDate?.toISOString(),
			adoptionDate: allData.examinationInfo?.adoptionDate?.toISOString(),
			approvedForCilDate: allData.examinationInfo?.approvedForCILDate?.toISOString()
		};
	}

	public async mapPlanWorkshop(caseId: string) {
		const caseData = await this.#service.db.case.findUnique({
			where: {
				id: caseId
			},
			select: {
				reference: true
			}
		});
		if (!caseData) {
			throw Error();
		}
		const workshopData = await this.#service.db.gateway2Info.findUnique({
			where: { caseId: caseId },
			include: { workshops: true }
		});
		if (!workshopData) {
			throw Error();
		}
		const data: Schemas.LocalPlansEvent[] = workshopData?.workshops.map((workshop) => ({
			id: workshop.id,
			caseId: caseId,
			caseReference: caseData.reference,
			eventName: '', // not currently stored
			venueName: workshop.workshopVenueName,
			eventType: 'gateway2Workshop',
			eventLocationType: this.validateField(workshop.workshopLocationType, this.#VALID_LOCATION_TYPES),
			eventStartDateTime: workshop.workshopDate?.toISOString(),
			eventEndDateTime: null, // not currently stored
			addressLine1: workshop.workshopAddressLine,
			addressLine2: workshop.workshopAddressLine2,
			addressTown: workshop.workshopTownOrCity,
			addressCounty: null, // not currently stored
			addressPostcode: workshop.workshopPostcode
		}));
		return data;
	}
	public async mapPlanHearing(caseId: string) {
		const caseData = await this.#service.db.case.findUnique({
			where: {
				id: caseId
			},
			select: {
				reference: true
			}
		});
		if (!caseData) {
			throw Error();
		}
		const hearingData = await this.#service.db.examinationInfo.findUnique({
			where: { caseId: caseId },
			include: { hearings: true }
		});
		if (!hearingData) {
			throw Error();
		}
		const data: Schemas.LocalPlansEvent[] = hearingData?.hearings.map((hearing) => ({
			id: hearing.id,
			caseId: caseId,
			caseReference: caseData.reference,
			eventName: '', // not currently stored
			venueName: hearing.hearingVenueName,
			eventType: 'examinationHearing',
			eventLocationType: this.validateField(hearing.hearingLocationType, this.#VALID_LOCATION_TYPES),
			eventStartDateTime: hearing.hearingDate?.toISOString(),
			eventEndDateTime: hearing.hearingEndDate?.toISOString(),
			addressLine1: hearing.hearingAddressLine,
			addressLine2: hearing.hearingAddressLine2,
			addressTown: hearing.hearingTownOrCity,
			addressCounty: null,
			addressPostcode: hearing.hearingPostcode
		}));
		return data;
	}
}
