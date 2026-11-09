import type { BaseService } from '@planning-inspectorate/core/app';
import type {
	Contact,
	PlanPauseHistory,
	Gateway3Submission,
	PrismaClient
} from '@pins/local-plans-database/src/client/client.ts';
import type { Schemas } from '@planning-inspectorate/data-model';
import { GATEWAY_3_DECISION_ID } from 'packages/database/src/seed/static-data/ids/case.ts';

function sortGateway3Submissions(submissions: Gateway3Submission[]) {
	return submissions.toSorted((a, b) => {
		if (!(a.completionDate || b.completionDate)) return 0;
		if (!a.completionDate) return 1;
		if (!b.completionDate) return -1;
		return a.completionDate.getTime() - b.completionDate.getTime();
	});
}

/**
 * Utility class to handle mapping data from Local Plans to the ODW system
 */
export class ODWDataMapper {
	#service: BaseService<PrismaClient>;
	#VALID_PLAN_TYPES = ['local_plans', 'other'];
	#VALID_PLAN_BANDS = [1, 2, 3];
	#VALID_EXAM_OUTCOMES = ['Sound', 'Unsound', 'Sound with modifications'];
	#VALID_LOCATION_TYPES = ['in_person', 'hybrid', 'virtual'];

	constructor(service: BaseService<PrismaClient>) {
		this.#service = service;
	}

	/**
	 * Map local plans kebab case strings to ODW slug case strings
	 * @param value The local plans field value
	 * @returns The value converted to ODW value format
	 */
	private mapKebabCaseToSlugCase(value: string) {
		return value.replace('-', '_');
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

	private formatYesNoField(value: string | null | undefined) {
		if (!value) {
			return null;
		}
		const valueLowerCase = value.toLowerCase();
		if (!(valueLowerCase == 'yes' || valueLowerCase == 'no')) {
			throw Error(`Expected field to be 'yes' or 'no' but was '${valueLowerCase}'`);
		}
		return valueLowerCase == 'yes';
	}

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

	private formatInspector(): Schemas.Inspector {
		// Will be fixed by LPBO-465
		return {
			entraId: '', // We identify some assessors by name rather than entraid - i need to confirm if all of these people have entra accounts before we switch on our side
			appointmentDate: '', // This is stored for all inspectors, rather than individual inspectors
			endDate: '' // This is stored for all inspectors, rather than individual inspectors
		};
	}

	private formatPauses(pauses: PlanPauseHistory[]): Schemas.PlanPauseHistory[] {
		return pauses.map((pause) => ({
			id: pause.id,
			startDate: pause.planPauseDate?.toISOString(),
			endDate: pause.planPauseEndDate?.toISOString()
		}));
	}

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
	 * Extract relevant case data from the database so that it can be submitted to the ODW
	 * @param caseId The id of the case to submit data for
	 * @returns The case data that the ODW requires
	 */
	public async mapPlanCase(caseId: string): Promise<Schemas.LocalPlansCase> {
		const allData = await this.#service.db.case.findUnique({
			where: {
				id: caseId
			},
			include: {
				gateway1Info: true,
				gateway2Info: true,
				gateway3Info: {
					include: {
						submissions: true
					}
				},
				examinationInfo: {
					include: {
						planPauseHistory: true
					}
				},
				contacts: true,
				lpas: true
			}
		});
		if (!allData) {
			throw Error(`No data was found for case with id '${caseId}'`);
		}
		return {
			id: caseId,
			caseReference: allData.reference,
			planTitle: allData.planTitle,
			planType: this.validateField(allData.planType, this.#VALID_PLAN_TYPES, this.mapKebabCaseToSlugCase),
			planBand: this.validateField(allData.planBand, this.#VALID_PLAN_BANDS),
			caseOfficerId: [allData.caseOfficer], // DISCREPANCY: todo LP schema to be fixed by LPBO-464
			lpaId: allData.lpas.map((lpa) => lpa.lpaCode),
			lpaContact: allData.contacts.map((contact) => this.formatContact(contact)),
			caseProgrammeOfficer: null, // DISCREPANCY: todo LP schema to be fixed by LPBO-465
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
			gateway2AssessorId: null, // Should be inspector, null for now while we fix the data model - to be fixed by LPBO-465
			gateway2ReportIssuedDate: allData.gateway2Info?.reportIssuedDate?.toISOString(),
			reportPublishedByLpaDate: allData.gateway2Info?.reportPublishedByLPA?.toISOString(),
			workshopDocumentUploadedDate: allData.gateway2Info?.workshopDocumentUploadedDate?.toISOString(),
			gateway3ExpectedDate: allData.gateway3Info?.expectedDate?.toISOString(),
			gateway3ActualDate: allData.gateway3Info?.actualDate?.toISOString(),
			gateway3AssessorId: null, // Should be inspector, null for now while we fix the data model - to be fixed by LPBO-465
			completionDate: this.calculateGateway3CompletionDate(allData.gateway3Info?.submissions ?? [])?.toISOString(),
			actualSubmissionForExaminationDate: allData.examinationInfo?.submissionForExaminationDate?.toISOString(),
			examiningInspectorId: null, // Should be inspector, null for now while we fix the data model - to be fixed by LPBO-465
			examinationWebsite: allData.examinationInfo?.examinationWebsiteUrl, // todo multiple website fields will be unified by LPBO-476
			letterSentToMHCLGDate: allData.examinationInfo?.letterSentToMHCLGDate?.toISOString(),
			letterIssueDate: allData.examinationInfo?.letterIssueDate?.toISOString(),
			qaDate: allData.examinationInfo?.QADate?.toISOString(),
			qaInspectorId: null, // Should be inspector, null for now while we fix the data model - to be fixed by LPBO-465
			reportSentToPanelDate: allData.examinationInfo?.reportSentToPanelDate?.toISOString(),
			panelresponseToInspectorDate: allData.examinationInfo?.panelResponseToInspectorDate?.toISOString(),
			factCheckDateReceivedFromInspector: allData.examinationInfo?.factCheckDateReceivedFromInspector?.toISOString(),
			factCheckDueDate: allData.examinationInfo?.factCheckDueDate?.toISOString(),
			factCheckActualDate: allData.examinationInfo?.factCheckActualDate?.toISOString(),
			factCheckReceivedBackFromLPADate: allData.examinationInfo?.factCheckReceivedBackFromLPADate?.toISOString(),
			finalReportIssueDate: allData.examinationInfo?.finalReportIssueDate?.toISOString(),
			pauses: this.formatPauses(allData.examinationInfo?.planPauseHistory ?? []),
			withdrawnDate: allData.examinationInfo?.withdrawnDate?.toISOString(),
			examinationOutcome: this.validateField(
				allData.examinationInfo?.isSound,
				this.#VALID_EXAM_OUTCOMES,
				this.mapExamOutcomeToODW
			),
			examinationOutcomeDate: allData.examinationInfo?.soundUnsoundDate?.toISOString(),
			adoptionDate: allData.examinationInfo?.adoptionDate?.toISOString(),
			approvedForCilDate: allData.examinationInfo?.approvedForCILDate?.toISOString()
		};
	}

	/**
	 * Extract relevant gateway 2 workshop data from the database so that it can be submitted to the ODW
	 * @param caseId The id of the case to submit workshop data for
	 * @returns The workshop data that the ODW requires
	 */
	public async mapPlanWorkshop(caseId: string) {
		const caseData = await this.#service.db.case.findUnique({
			where: {
				id: caseId
			},
			select: {
				reference: true,
				gateway2Info: {
					select: {
						workshops: true
					}
				}
			}
		});
		if (!caseData) {
			throw Error(
				`No case data could be found for case with id '${caseId}' when preparing plan workshop data for the ODW`
			);
		}
		const workshopData = caseData.gateway2Info?.workshops;
		if (!workshopData) {
			throw Error(
				`No workshop data could be found for case with id '${caseId}' when preparing plan workshop data for the ODW`
			);
		}
		const data: Schemas.PlansEvent[] = workshopData.map((workshop) => ({
			id: workshop.id,
			caseId: caseId,
			caseReference: caseData.reference,
			venueName: workshop.workshopVenueName,
			eventType: 'gateway_2_workshop',
			eventLocationType: this.validateField(
				workshop.workshopLocationType,
				this.#VALID_LOCATION_TYPES,
				this.mapKebabCaseToSlugCase
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
	 * Extract relevant exam hearing data from the database so that it can be submitted to the ODW
	 * @param caseId The id of the case to submit hearing data for
	 * @returns The hearing data that the ODW requires
	 */
	public async mapPlanHearing(caseId: string) {
		const caseData = await this.#service.db.case.findUnique({
			where: {
				id: caseId
			},
			select: {
				reference: true,
				examinationInfo: {
					select: {
						hearings: true
					}
				}
			}
		});
		if (!caseData) {
			throw Error(
				`No case data could be found for case with id '${caseId}' when preparing plan workshop data for the ODW`
			);
		}
		const hearingData = caseData.examinationInfo?.hearings;
		if (!hearingData) {
			throw Error(
				`No hearing data could be found for case with id '${caseId}' when preparing plan hearing data for the ODW`
			);
		}
		const data: Schemas.PlansEvent[] = hearingData.map((hearing) => ({
			id: hearing.id,
			caseId: caseId,
			caseReference: caseData.reference,
			venueName: hearing.hearingVenueName,
			eventType: 'examination_hearing',
			eventLocationType: this.validateField(
				hearing.hearingLocationType,
				this.#VALID_LOCATION_TYPES,
				this.mapKebabCaseToSlugCase
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
