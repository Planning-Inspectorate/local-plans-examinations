import type { BaseService } from '@planning-inspectorate/core/app';
import type {
	Case,
	Gateway1Info,
	Gateway2Info,
	Gateway2Workshop,
	Gateway3Info,
	Gateway3Submission,
	ExaminationInfo,
	ExaminationHearing,
	PlanPauseHistory,
	Contact,
	LPA,
	PrismaClient
} from '@pins/local-plans-database/src/client/client.ts';
import type { Schemas } from '@planning-inspectorate/data-model';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/case.ts';
import type { CaseIdOrCaseReference } from '../util/types.ts';

function sortGateway3Submissions(submissions: Gateway3Submission[]) {
	return submissions.toSorted((a, b) => {
		if (!(a.completionDate || b.completionDate)) return 0;
		if (!a.completionDate) return 1;
		if (!b.completionDate) return -1;
		return a.completionDate.getTime() - b.completionDate.getTime();
	});
}

type AllCaseData = Case & {
	lpas: LPA[];
	contacts: Contact[];
	gateway1Info: null | Gateway1Info;
	gateway2Info: null | (Gateway2Info & { workshops: Gateway2Workshop[] | null });
	gateway3Info: null | (Gateway3Info & { submissions: Gateway3Submission[] | null });
	examinationInfo:
		null | (ExaminationInfo & { planPauseHistory: PlanPauseHistory[] | null; hearings: ExaminationHearing[] | null });
};

type ODWData = {
	case: Schemas.LocalPlansCase;
	events: Schemas.PlansEvent[];
};

/**
 * Utility class to handle mapping data from Local Plans to the ODW system
 */
export class ODWDataMapper {
	#service: BaseService<PrismaClient>;
	#VALID_PLAN_TYPES = ['local_plans', 'other'];
	#VALID_PLAN_BANDS = [1, 2, 3, null];
	#VALID_EXAM_OUTCOMES = ['Sound', 'Unsound', 'Sound with modifications', null];
	#VALID_LOCATION_TYPES = ['in_person', 'hybrid', 'virtual', null];

	constructor(service: BaseService<PrismaClient>) {
		this.#service = service;
	}

	/**
	 * Convert a planType in Local Plans format to the format the ODW expects
	 * @param value The local plans planType value
	 * @returns The value converted to ODW value format
	 */
	private mapPlanTypeToODW(value: string) {
		const map: Record<string, string> = {
			['local-plan']: 'local_plans'
		};
		if (value in map) {
			return map[value];
		}
		return value;
	}

	/**
	 * Map local plans outcome srings to ODW outcome strings
	 * @param value The local plans outcome
	 * @returns The ODW outcome
	 */
	private mapExamOutcomeToODW(value: string) {
		const map: Record<string, string> = {
			sound: 'Sound',
			unsound: 'Unsound',
			['sound-with-modifications']: 'Sound with modifications'
		};
		if (value in map) {
			return map[value];
		}
		return value;
	}

	private mapLocationTypeToODW(value: string) {
		const map: Record<string, string> = {
			['in-person']: 'in_person',
			hybrid: 'hybrid',
			remote: 'virtual'
		};
		if (value in map) {
			return map[value];
		}
		return value;
	}

	/**
	 * Check that the given field value matches the given allowed values. If a mappingFunction is supplied, then the value is converted using the mapping function before comparison
	 * @param value The value to check
	 * @param allowedValues The allowed values of the value
	 * @param mappingFunction Optional function to convert the value before comparing against `allowedValues`
	 * @returns The value if it is valid, raises an exception if not valid
	 */
	private validateField(value: any, allowedValues: any[], mappingFunction?: (value: any) => any) {
		const valueToCheck = mappingFunction ? mappingFunction(value) : value;
		if (!allowedValues.includes(valueToCheck)) {
			throw Error(
				`Expected the raw field value '${value}' to match one of ${allowedValues}, but checked was '${valueToCheck}'`
			);
		}
		return value;
	}

	/**
	 * Convert a field with 'yes' or 'no' values to boolean
	 * @param value The string value
	 * @returns The string value as a boolean
	 */
	private formatYesNoField(value: string | null | undefined) {
		if (!value) {
			return null;
		}
		const valueLowerCase = value.toLowerCase().trim();
		if (!(valueLowerCase == 'yes' || valueLowerCase == 'no')) {
			throw Error(`Expected field to be 'yes' or 'no' but was '${valueLowerCase}'`);
		}
		return valueLowerCase == 'yes';
	}

	/**
	 * Formats a contact in Local Plans format to the ODW format
	 * @param contact
	 * @returns
	 */
	private formatContact(contact: Contact): Schemas.LocalPlansContact {
		return {
			id: contact.id,
			firstName: contact.firstName,
			lastName: contact.lastName,
			emailAddress: contact.email,
			phone: contact.phoneNumber,
			pinsLpaCode: contact.lpaCode,
			startDate: '', // DISCREPANCY: local plans does not store start/end dates for contacts/lpas - to fix as part of LPBO-466
			endDate: null // DISCREPANCY: local plans does not store start/end dates for contacts/lpas - to fix as part of LPBO-466
		};
	}

	/**
	 * Format an inspector in Local Plans format to the ODW format
	 * @returns
	 */
	private formatInspector(): Schemas.Inspector {
		// Will be fixed by LPBO-465, currently this is just a placeholder
		return {
			entraId: '', // We identify some assessors by name rather than entraid - i need to confirm if all of these people have entra accounts before we switch on our side
			appointmentDate: '', // This is stored for all inspectors, rather than individual inspectors
			endDate: '' // This is stored for all inspectors, rather than individual inspectors
		};
	}

	/**
	 * Format plan pauses in Local Plans format into the the ODW format
	 * @param pauses The pauses in Local Plans format
	 * @returns The pauses in ODW format
	 */
	private formatPauses(pauses: PlanPauseHistory[]): Schemas.PlanPauseHistory[] {
		return pauses.map((pause) => ({
			id: pause.id,
			startDate: pause.planPauseDate?.toISOString(),
			endDate: pause.planPauseEndDate?.toISOString()
		}));
	}

	/**
	 * Calculate the date the final submission that marks the case as complete
	 * @param submissions The gw3 submissions to check
	 * @returns The date of the last complete sumission, or null if gw3 is not complete
	 */
	private calculateGateway3CompletionDate(submissions: Gateway3Submission[]) {
		if (!submissions) {
			return null;
		}
		const sortedSubmissions = sortGateway3Submissions(submissions);
		const lastSubmission = sortedSubmissions.at(-1);
		// If Gateway3 is complete
		if (lastSubmission?.decision == GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION) {
			return lastSubmission.completionDate;
		}
		return null;
	}

	/**
	 * Map data from Local Plans format to the ODW format
	 * @param caseReference The reference number of the case
	 * @param workshopsUpdated Whether or not workshop data should be queried
	 * @param hearingsUpdated Whether or not hearing data should be queried
	 * @returns The data in the ODW service bus format
	 */
	public async mapData(
		caseIdOrCaseReference: CaseIdOrCaseReference,
		workshopsUpdated: boolean,
		hearingsUpdated: boolean
	): Promise<ODWData> {
		const whereClause = caseIdOrCaseReference.caseId
			? {
					id: caseIdOrCaseReference.caseId
				}
			: {
					reference: caseIdOrCaseReference.caseReference
				};
		const allData = await this.#service.db.case.findUnique({
			where: whereClause,
			include: {
				gateway1Info: true,
				gateway2Info: {
					include: {
						workshops: workshopsUpdated
					}
				},
				gateway3Info: {
					include: {
						submissions: true
					}
				},
				examinationInfo: {
					include: {
						planPauseHistory: true,
						hearings: hearingsUpdated
					}
				},
				contacts: true,
				lpas: true
			}
		});
		if (!allData) {
			const errorDetail = caseIdOrCaseReference.caseId
				? `caseId '${caseIdOrCaseReference.caseId}'`
				: `reference '${caseIdOrCaseReference.caseReference}'`;
			throw Error(`No data was found for case with ${errorDetail}`);
		}
		const caseData = await this.mapPlanCase(allData);
		const eventData: Schemas.PlansEvent[] = [];
		if (workshopsUpdated) {
			const workshopData = await this.mapPlanWorkshop(allData);
			eventData.push(...workshopData);
		}
		if (hearingsUpdated) {
			const hearingData = await this.mapPlanHearing(allData);
			eventData.push(...hearingData);
		}
		return { case: caseData, events: eventData };
	}

	/**
	 * Format case data into the ODW format
	 * @param caseData The data to prepare
	 * @returns The case data that the ODW requires
	 */
	private async mapPlanCase(caseData: AllCaseData): Promise<Schemas.LocalPlansCase> {
		return {
			id: caseData.id,
			caseReference: caseData.reference,
			planTitle: caseData.planTitle,
			planType: this.validateField(caseData.planType, this.#VALID_PLAN_TYPES, this.mapPlanTypeToODW),
			planBand: this.validateField(caseData.planBand, this.#VALID_PLAN_BANDS),
			caseOfficerId: [caseData.caseOfficer], // DISCREPANCY: todo LP schema to be fixed by LPBO-464
			lpaId: caseData.lpas.map((lpa) => lpa.lpaCode),
			lpaContact: caseData.contacts.map((contact) => this.formatContact(contact)),
			caseProgrammeOfficer: null, // DISCREPANCY: todo LP schema to be fixed by LPBO-465
			intentionToCommenceDate: caseData.intentionToCommenceDate?.toISOString(),
			expectedSubmissionForExaminationDate:
				caseData.examinationInfo?.expectedSubmissionForExaminationDate?.toISOString(),
			expectedPublicationDate: null, // todo need to check this
			createdDate: caseData.createdAt.toISOString(),
			deletedDate: caseData.deletedDate?.toISOString(),
			gateway1ExpectedDate: caseData.gateway1Info?.expectedGateway1Date?.toISOString(),
			gateway1ActualDate: caseData.gateway1Info?.completedGateway1Date?.toISOString(),
			slaSentDate: caseData.gateway1Info?.slaSentDate?.toISOString(),
			slaReceivedDate: caseData.gateway1Info?.slaReceivedDate?.toISOString(),
			dsaCurrentAndValid: this.formatYesNoField(caseData.gateway1Info?.dsaChecked),
			gateway2ExpectedDate: caseData.gateway2Info?.expectedDate?.toISOString(),
			gateway2ActualDate: caseData.gateway2Info?.actualDate?.toISOString(),
			gateway2AssessorId: null, // Should be inspector, null for now while we fix the data model - to be fixed by LPBO-465
			gateway2ReportIssuedDate: caseData.gateway2Info?.reportIssuedDate?.toISOString(),
			reportPublishedByLpaDate: caseData.gateway2Info?.reportPublishedByLPA?.toISOString(),
			workshopDocumentUploadedDate: caseData.gateway2Info?.workshopDocumentUploadedDate?.toISOString(),
			gateway3ExpectedDate: caseData.gateway3Info?.expectedDate?.toISOString(),
			gateway3ActualDate: caseData.gateway3Info?.actualDate?.toISOString(),
			gateway3AssessorId: null, // Should be inspector, null for now while we fix the data model - to be fixed by LPBO-465
			completionDate: this.calculateGateway3CompletionDate(caseData.gateway3Info?.submissions ?? [])?.toISOString(),
			actualSubmissionForExaminationDate: caseData.examinationInfo?.submissionForExaminationDate?.toISOString(),
			examiningInspectorId: null, // Should be inspector, null for now while we fix the data model - to be fixed by LPBO-465
			examinationWebsite: caseData.examinationInfo?.examinationWebsiteUrl, // todo multiple website fields will be unified by LPBO-476
			letterSentToMHCLGDate: caseData.examinationInfo?.letterSentToMHCLGDate?.toISOString(),
			letterIssueDate: caseData.examinationInfo?.letterIssueDate?.toISOString(),
			qaDate: caseData.examinationInfo?.QADate?.toISOString(),
			qaInspectorId: null, // Should be inspector, null for now while we fix the data model - to be fixed by LPBO-465
			reportSentToPanelDate: caseData.examinationInfo?.reportSentToPanelDate?.toISOString(),
			panelresponseToInspectorDate: caseData.examinationInfo?.panelResponseToInspectorDate?.toISOString(),
			factCheckDateReceivedFromInspector: caseData.examinationInfo?.factCheckDateReceivedFromInspector?.toISOString(),
			factCheckDueDate: caseData.examinationInfo?.factCheckDueDate?.toISOString(),
			factCheckActualDate: caseData.examinationInfo?.factCheckActualDate?.toISOString(),
			factCheckReceivedBackFromLPADate: caseData.examinationInfo?.factCheckReceivedBackFromLPADate?.toISOString(),
			finalReportIssueDate: caseData.examinationInfo?.finalReportIssueDate?.toISOString(),
			pauses: this.formatPauses(caseData.examinationInfo?.planPauseHistory ?? []),
			withdrawnDate: caseData.examinationInfo?.withdrawnDate?.toISOString(),
			examinationOutcome: this.validateField(
				caseData.examinationInfo?.isSound,
				this.#VALID_EXAM_OUTCOMES,
				this.mapExamOutcomeToODW
			),
			examinationOutcomeDate: caseData.examinationInfo?.soundUnsoundDate?.toISOString(),
			adoptionDate: caseData.examinationInfo?.adoptionDate?.toISOString(),
			approvedForCilDate: caseData.examinationInfo?.approvedForCILDate?.toISOString()
		};
	}

	/**
	 * Format workshop data into the ODW format
	 * @param caseData The data to prepare
	 * @returns The workshop data that the ODW requires
	 */
	private async mapPlanWorkshop(caseData: AllCaseData) {
		const workshopData = caseData.gateway2Info?.workshops;
		if (!workshopData) {
			throw Error(
				`No workshop data could be found for case with id '${caseData.id}' when preparing plan workshop data for the ODW`
			);
		}
		const data: Schemas.PlansEvent[] = workshopData.map((workshop) => ({
			id: workshop.id,
			caseId: caseData.id,
			caseReference: caseData.reference,
			venueName: workshop.workshopVenueName,
			eventType: 'gateway_2_workshop',
			eventLocationType: this.validateField(
				workshop.workshopLocationType,
				this.#VALID_LOCATION_TYPES,
				this.mapLocationTypeToODW
			),
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

	/**
	 * Format hearing data into the ODW format
	 * @param caseData The data to prepare
	 * @returns The hearing data that the ODW requires
	 */
	private async mapPlanHearing(caseData: AllCaseData) {
		const hearingData = caseData.examinationInfo?.hearings;
		if (!hearingData) {
			throw Error(
				`No hearing data could be found for case with id '${caseData.id}' when preparing plan hearing data for the ODW`
			);
		}
		const data: Schemas.PlansEvent[] = hearingData.map((hearing) => ({
			id: hearing.id,
			caseId: caseData.id,
			caseReference: caseData.reference,
			venueName: hearing.hearingVenueName,
			eventType: 'examination_hearing',
			eventLocationType: this.validateField(
				hearing.hearingLocationType,
				this.#VALID_LOCATION_TYPES,
				this.mapLocationTypeToODW
			),
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
