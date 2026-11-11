import assert from 'node:assert/strict';
import { describe, it, mock, beforeEach } from 'node:test';
import { BaseService } from '@planning-inspectorate/core/app';
import { ODWDataMapper, type AllCaseData } from './odw-data-mapper.ts';
import type {
	Contact,
	PlanPauseHistory,
	Gateway3Submission,
	PrismaClient
} from '@pins/local-plans-database/src/client/client.ts';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/case.ts';
import type { Schemas } from '@planning-inspectorate/data-model';

class ODWDataMapperWrapper extends ODWDataMapper {
	public mapPlanTypeToODWWrapper(value: string) {
		return this.mapPlanTypeToODW(value);
	}
	public mapExamOutcomeToODWWrapper(value: string) {
		return this.mapExamOutcomeToODW(value);
	}
	public mapLocationTypeToODWWrapper(value: string) {
		return this.mapLocationTypeToODW(value);
	}
	public validateFieldWrapper(value: any, allowedValues: any[], mappingFunction?: (value: any) => any) {
		return this.validateField(value, allowedValues, mappingFunction);
	}
	public formatYesNoFieldWrapper(value: string) {
		return this.formatYesNoField(value);
	}
	public formatContactWrapper(contact: Contact) {
		return this.formatContact(contact);
	}
	public formatInspectorWrapper(inspector: any) {
		return this.formatInspector();
	}
	public formatPausesWrapper(pauses: PlanPauseHistory[]) {
		return this.formatPauses(pauses);
	}
	public calculateGateway3CompletionDateWrapper(submissions: any) {
		return this.calculateGateway3CompletionDate(submissions);
	}
	public mapPlanCaseWrapper(caseData: AllCaseData) {
		return this.mapPlanCase(caseData);
	}
	public mapPlanWorkshopWrapper(caseData: AllCaseData) {
		return this.mapPlanWorkshop(caseData);
	}
	public mapPlanHearingWrapper(caseData: AllCaseData) {
		return this.mapPlanHearing(caseData);
	}
}

const caseData = {
	id: 'someCaseId',
	reference: 'someCaseReference',
	planTitle: 'somePlanTitle',
	planType: 'local-plan',
	planBand: 1,
	caseOfficer: 'someCaseOfficer', // This will be changed by LPBO-464
	lpas: [{ lpaCode: 'a' }, { lpaCode: 'b' }, { lpaCode: 'c' }],
	contacts: [
		{
			id: 'contact1',
			email: 'someEmail',
			lpaCode: 'someLPACode',
			firstName: 'jim',
			lastName: 'bob',
			phoneNumber: '0123456789'
		}
	],
	intentionToCommenceDate: new Date('2026-01-01'),
	createdAt: new Date('2026-01-03'),
	deletedDate: new Date('2026-01-04')
};
const gateway1Data = {
	expectedGateway1Date: new Date('2026-01-05'),
	completedGateway1Date: new Date('2026-01-06'),
	slaSentDate: new Date('2026-01-07'),
	slaReceivedDate: new Date('2026-01-08'),
	dsaChecked: 'yes'
};
const gateway2Data = {
	expectedDate: new Date('2026-01-09'),
	actualDate: new Date('2026-01-10'),
	reportIssuedDate: new Date('2026-01-11'),
	reportPublishedByLPA: new Date('2026-01-12'),
	workshopDocumentUploadedDate: new Date('2026-01-13'),
	workshops: [
		{
			id: 'workshop1',
			gateway2InfoId: '',
			createdDate: new Date('2026-02-09'),
			workshopDate: new Date('2026-02-10'),
			workshopTime: '0',
			workshopEndTime: '0',
			workshopExpectedDaysKnown: 'yes',
			workshopExpectedDays: '5',
			workshopLocationType: 'remote',
			remoteMeetingLinkKnown: 'yes',
			remoteMeetingLink: 'someLink',
			workshopLocationKnown: 'yes',
			workshopVenueName: 'someVenue',
			workshopAddressLine: 'someAddress1',
			workshopAddressLine2: 'someAddress2',
			workshopTownOrCity: 'someTown',
			workshopPostcode: 'somePostcode'
		}
	]
};
const gateway3Data = {
	expectedDate: new Date('2026-01-14'),
	actualDate: new Date('2026-01-15'),
	submissions: [
		{
			id: 'someSubmissionId1',
			decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION,
			completionDate: new Date('2026-02-01'),
			submittedDate: null,
			gateway3InfoId: ''
		},
		{
			id: 'someSubmissionId2',
			decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
			completionDate: new Date('2026-01-31'),
			submittedDate: null,
			gateway3InfoId: ''
		}
	]
};
const examData = {
	expectedSubmissionForExaminationDate: new Date('2026-01-02'),
	submissionForExaminationDate: new Date('2026-01-16'),
	examinationWebsiteUrl: 'someUrl',
	letterSentToMHCLGDate: new Date('2026-01-17'),
	letterIssueDate: new Date('2026-01-18'),
	QADate: new Date('2026-01-19'),
	reportSentToPanelDate: new Date('2026-01-20'),
	panelResponseToInspectorDate: new Date('2026-01-21'),
	factCheckDateReceivedFromInspector: new Date('2026-01-22'),
	factCheckDueDate: new Date('2026-01-23'),
	factCheckActualDate: new Date('2026-01-24'),
	factCheckReceivedBackFromLPADate: new Date('2026-01-25'),
	finalReportIssueDate: new Date('2026-01-26'),
	withdrawnDate: new Date('2026-01-27'),
	isSound: 'sound',
	soundUnsoundDate: new Date('2026-01-28'),
	adoptionDate: new Date('2026-01-29'),
	approvedForCILDate: new Date('2026-01-30'),
	planPauseHistory: [
		{
			id: 'pause1',
			createdAt: new Date('2026-02-02'),
			examinationInfoId: '',
			planPauseDate: new Date('2026-02-03'),
			planPauseStartDetails: 'some reason 1',
			planPauseEndDate: new Date('2026-02-04'),
			planPauseEndDetails: 'some reason 2'
		},
		{
			id: 'pause2',
			createdAt: new Date('2026-02-05'),
			examinationInfoId: '',
			planPauseDate: new Date('2026-02-06'),
			planPauseStartDetails: 'some reason 3',
			planPauseEndDate: new Date('2026-02-07'),
			planPauseEndDetails: 'some reason 4'
		}
	],
	hearings: [
		{
			id: 'hearingId',
			createdDate: new Date('2026-02-08'),
			ExaminationInfoID: '',
			hearingComplete: true,
			hearingDate: new Date('2026-02-09'),
			hearingTime: '0',
			hearingExpectedDaysKnown: 'yes',
			hearingExpectedDays: 5,
			hearingLocationType: 'remote',
			hearingRemoteMeetingLinkKnown: 'yes',
			hearingRemoteMeetingLink: 'someLink',
			hearingLocationKnown: 'yes',
			hearingVenueName: 'someVenue',
			hearingAddressLine: 'address1',
			hearingAddressLine2: 'address2',
			hearingTownOrCity: 'someTown',
			hearingPostcode: 'somePostcode',
			hearingDuration: '6',
			hearingEndDate: new Date('2026-02-10')
		}
	]
};
const mockDBResult = {
	...caseData,
	gateway1Info: gateway1Data,
	gateway2Info: gateway2Data,
	gateway3Info: gateway3Data,
	examinationInfo: examData
};

describe('test ODWDataMapper', () => {
	describe('test mapPlanTypeToODW', () => {
		const dataMapper = new ODWDataMapperWrapper({} as BaseService<PrismaClient>);
		it('converts local-plan to local_plans', () => {
			const result = dataMapper.mapPlanTypeToODWWrapper('local-plan');
			assert.strictEqual(result, 'local_plans');
		});
		it('does not convert other values', () => {
			const result = dataMapper.mapPlanTypeToODWWrapper('other');
			assert.strictEqual(result, 'other');
		});
	});
	describe('test mapExamOutcomeToODW', () => {
		const dataMapper = new ODWDataMapperWrapper({} as BaseService<PrismaClient>);
		it('converts sound to Sound', () => {
			const result = dataMapper.mapExamOutcomeToODWWrapper('sound');
			assert.strictEqual(result, 'Sound');
		});
		it('converts unsound to Unsound', () => {
			const result = dataMapper.mapExamOutcomeToODWWrapper('unsound');
			assert.strictEqual(result, 'Unsound');
		});
		it('converts sound-with-modifications to Unsound', () => {
			const result = dataMapper.mapExamOutcomeToODWWrapper('sound-with-modifications');
			assert.strictEqual(result, 'Sound with modifications');
		});
		it('does not convert other values', () => {
			const result = dataMapper.mapExamOutcomeToODWWrapper('other');
			assert.strictEqual(result, 'other');
		});
	});
	describe('test mapLocationTypeToODW', () => {
		const dataMapper = new ODWDataMapperWrapper({} as BaseService<PrismaClient>);
		it('converts in-person to in_person', () => {
			const result = dataMapper.mapLocationTypeToODWWrapper('in-person');
			assert.strictEqual(result, 'in_person');
		});
		it('converts hybrid to hybrid', () => {
			const result = dataMapper.mapLocationTypeToODWWrapper('hybrid');
			assert.strictEqual(result, 'hybrid');
		});
		it('converts remote to virtual', () => {
			const result = dataMapper.mapLocationTypeToODWWrapper('remote');
			assert.strictEqual(result, 'virtual');
		});
		it('does not convert other values', () => {
			const result = dataMapper.mapLocationTypeToODWWrapper('other');
			assert.strictEqual(result, 'other');
		});
	});
	describe('test validateField', () => {
		const dataMapper = new ODWDataMapperWrapper({} as BaseService<PrismaClient>);
		const allowedValues = ['Jean-Luc Picard', 'Benjamin Sisko', 'Kathryn Janeway'];
		it('can match a value without a specified mapping function', () => {
			const result = dataMapper.validateFieldWrapper('Jean-Luc Picard', allowedValues);
			assert.equal(result, 'Jean-Luc Picard');
		});
		it('can reject a value without a specified mapping function', () => {
			assert.rejects(async () => {
				dataMapper.validateFieldWrapper('James T Kirk', allowedValues);
			});
		});
		it('can match a value with a specified mapping function', () => {
			const mappingFunction = (name: string) => {
				return name == 'Locutus' ? 'Jean-Luc Picard' : name;
			};
			const result = dataMapper.validateFieldWrapper('Locutus', allowedValues, mappingFunction);
			assert.equal(result, 'Jean-Luc Picard');
		});
		it('can reject a value with a specified mapping function', () => {
			const mappingFunction = (name: string) => {
				return name == 'Benjamin Sisko' ? 'Emissary' : name;
			};
			assert.rejects(async () => {
				dataMapper.validateFieldWrapper('Benjamin Sisko', allowedValues, mappingFunction);
			});
		});
	});
	describe('test formatYesNoField', () => {
		const dataMapper = new ODWDataMapperWrapper({} as BaseService<PrismaClient>);
		it('returns null when an empty string is supplied', () => {
			const result = dataMapper.formatYesNoFieldWrapper('');
			assert.equal(result, null);
		});
		it('returns true when yes is supplied', () => {
			const result = dataMapper.formatYesNoFieldWrapper('yes');
			assert.equal(result, true);
		});
		it('returns true when Yes is supplied', () => {
			const result = dataMapper.formatYesNoFieldWrapper('Yes');
			assert.equal(result, true);
		});
		it('returns true when YES is supplied', () => {
			const result = dataMapper.formatYesNoFieldWrapper('YES');
			assert.equal(result, true);
		});
		it('returns false when no is supplied', () => {
			const result = dataMapper.formatYesNoFieldWrapper('no');
			assert.equal(result, false);
		});
		it('returns false when No is supplied', () => {
			const result = dataMapper.formatYesNoFieldWrapper('No');
			assert.equal(result, false);
		});
		it('returns false when NO is supplied', () => {
			const result = dataMapper.formatYesNoFieldWrapper('NO');
			assert.equal(result, false);
		});
		it('raises an exception when an unexpected string is supplied', () => {
			assert.rejects(async () => {
				dataMapper.formatYesNoFieldWrapper('some bad string');
			});
		});
	});
	describe('test formatContact', () => {
		const dataMapper = new ODWDataMapperWrapper({} as BaseService<PrismaClient>);
		it('can format a contact', () => {
			const contact = {
				id: 'someId',
				firstName: 'some firstName',
				lastName: 'some lastName',
				email: 'some email',
				phoneNumber: 'some phoneNumber',
				lpaCode: 'some lpaCode'
				// DISCREPANCY: local plans does not store start/end dates for contacts/lpas - to fix as part of LPBO-466
				// DISCREPANCY: local plans does not store start/end dates for contacts/lpas - to fix as part of LPBO-466
			} as Contact;
			const expectedResult = {
				id: 'someId',
				firstName: 'some firstName',
				lastName: 'some lastName',
				emailAddress: 'some email',
				phone: 'some phoneNumber',
				pinsLpaCode: 'some lpaCode',
				startDate: '', // DISCREPANCY: local plans does not store start/end dates for contacts/lpas - to fix as part of LPBO-466
				endDate: null // DISCREPANCY: local plans does not store start/end dates for contacts/lpas - to fix as part of LPBO-466
			};
			const actualResult = dataMapper.formatContactWrapper(contact);
			assert.deepEqual(actualResult, expectedResult);
		});
	});
	describe('test formatInspector', () => {
		// Will be implemented by LPBO-465, currently this is just a placeholder
	});
	describe('test formatPauses', () => {
		it('can format a pause list', () => {
			const dataMapper = new ODWDataMapperWrapper({} as BaseService<PrismaClient>);
			const pauses: PlanPauseHistory[] = [
				{
					id: 'idA',
					createdAt: new Date(),
					planPauseStartDetails: 'some start reason',
					planPauseDate: new Date('2026-01-01'),
					planPauseEndDetails: 'some end reason',
					planPauseEndDate: new Date('2026-01-02'),
					examinationInfoId: ''
				},
				{
					id: 'idB',
					createdAt: new Date(),
					planPauseStartDetails: 'some start reason',
					planPauseDate: new Date('2026-01-03'),
					planPauseEndDetails: 'some end reason',
					planPauseEndDate: new Date('2026-01-04'),
					examinationInfoId: ''
				}
			];
			const expectedResult = [
				{
					id: 'idA',
					startDate: new Date('2026-01-01').toISOString(),
					endDate: new Date('2026-01-02').toISOString()
				},
				{
					id: 'idB',
					startDate: new Date('2026-01-03').toISOString(),
					endDate: new Date('2026-01-4').toISOString()
				}
			];
			const actualResult = dataMapper.formatPausesWrapper(pauses);
			assert.deepEqual(actualResult, expectedResult);
		});
	});
	describe('test calculateGateway3CompletionDate', () => {
		const dataMapper = new ODWDataMapperWrapper({} as BaseService<PrismaClient>);
		it('returns null if no submissions are supplied', () => {
			const submissions: Gateway3Submission[] = [];
			const result = dataMapper.calculateGateway3CompletionDateWrapper(submissions);
			assert.equal(result, null);
		});
		it('returns null if there are no submissions with decision "Proceed to examination"', () => {
			const submissions: Gateway3Submission[] = [
				{
					id: 'idA',
					decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
					completionDate: new Date('2026-01-02'),
					submittedDate: new Date('2026-01-01'),
					gateway3InfoId: ''
				},
				{
					id: 'idB',
					decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
					completionDate: new Date('2026-01-04'),
					submittedDate: new Date('2026-01-03'),
					gateway3InfoId: ''
				}
			];
			const result = dataMapper.calculateGateway3CompletionDateWrapper(submissions);
			assert.equal(result, null);
		});
		it('returns the date of the final submission that has decision "Proceed to examination"', () => {
			const submissions: Gateway3Submission[] = [
				{
					id: 'idA',
					decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
					completionDate: new Date('2026-01-02'),
					submittedDate: new Date('2026-01-01'),
					gateway3InfoId: ''
				},
				{
					// Not in the correct order, the submissions should be sorted
					id: 'idB',
					decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION,
					completionDate: new Date('2026-01-06'),
					submittedDate: new Date('2026-01-05'),
					gateway3InfoId: ''
				},
				{
					id: 'idC',
					decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
					completionDate: new Date('2026-01-04'),
					submittedDate: new Date('2026-01-03'),
					gateway3InfoId: ''
				}
			];
			const result = dataMapper.calculateGateway3CompletionDateWrapper(submissions);
			assert.deepEqual(result, new Date('2026-01-06'));
		});
	});
	describe('test mapData', async () => {
		const service = {
			db: {
				case: {
					findUnique: mock.fn(async () => mockDBResult)
				}
			}
		};
		const mockPlanCaseResponse = {
			id: 'someCaseId',
			caseReference: 'someCaseReference',
			planTitle: 'somePlanTitle',
			planType: 'local_plans',
			planBand: 1,
			caseOfficerId: ['someCaseOfficer'], // DISCREPANCY: todo LP schema to be fixed by LPBO-464
			lpaId: [],
			lpaContact: [],
			caseProgrammeOfficer: null, // DISCREPANCY: todo LP schema to be fixed by LPBO-465
			intentionToCommenceDate: null,
			expectedSubmissionForExaminationDate: null,
			expectedPublicationDate: null, // todo need to check this
			createdDate: null,
			deletedDate: null,
			gateway1ExpectedDate: null,
			gateway1ActualDate: null,
			slaSentDate: null,
			slaReceivedDate: null,
			dsaCurrentAndValid: null,
			gateway2ExpectedDate: null,
			gateway2ActualDate: null,
			gateway2AssessorId: null,
			gateway2ReportIssuedDate: null,
			reportPublishedByLpaDate: null,
			workshopDocumentUploadedDate: null,
			gateway3ExpectedDate: null,
			gateway3ActualDate: null,
			gateway3AssessorId: null,
			completionDate: null,
			actualSubmissionForExaminationDate: null,
			examiningInspectorId: null,
			examinationWebsite: 'someUrl',
			letterSentToMHCLGDate: null,
			letterIssueDate: null,
			qaDate: null,
			qaInspectorId: null,
			reportSentToPanelDate: null,
			panelresponseToInspectorDate: null,
			factCheckDateReceivedFromInspector: null,
			factCheckDueDate: null,
			factCheckActualDate: null,
			factCheckReceivedBackFromLPADate: null,
			finalReportIssueDate: null,
			pauses: [],
			withdrawnDate: null,
			examinationOutcome: 'Sound',
			examinationOutcomeDate: null,
			adoptionDate: null,
			approvedForCilDate: null
		};
		const mockPlanWorkshopResponse = [
			{
				id: 'someWorkshopId',
				caseId: 'someCaseId',
				caseReference: 'someCaseReference',
				venueName: 'someVenue',
				eventType: 'gateway_2_workshop',
				eventLocationType: 'virtual',
				eventStartDateTime: null,
				eventEndDateTime: null,
				addressLine1: null,
				addressLine2: null,
				addressTown: null,
				addressCounty: null,
				addressPostcode: null
			}
		] as Schemas.PlansEvent[];
		const mockPlanHearingResponse = [
			{
				id: 'someHearingId',
				caseId: 'someCaseId',
				caseReference: 'someCaseReference',
				venueName: 'someVenue',
				eventType: 'examination_hearing',
				eventLocationType: 'virtual',
				eventStartDateTime: null,
				eventEndDateTime: null,
				addressLine1: null,
				addressLine2: null,
				addressTown: null,
				addressCounty: null,
				addressPostcode: null
			}
		] as Schemas.PlansEvent[];
		const dataMapper = new ODWDataMapperWrapper(service as unknown as BaseService<PrismaClient>);
		const mockMapPlanCase = mock.method(dataMapper as any, 'mapPlanCase', () => mockPlanCaseResponse);
		const mockMapPlanWorkshop = mock.method(dataMapper as any, 'mapPlanWorkshop', () => mockPlanWorkshopResponse);
		const mockMapPlanHearing = mock.method(dataMapper as any, 'mapPlanHearing', () => mockPlanHearingResponse);
		beforeEach(() => {
			service.db.case.findUnique.mock.resetCalls();
			mockMapPlanCase.mock.resetCalls();
			mockMapPlanWorkshop.mock.resetCalls();
			mockMapPlanHearing.mock.resetCalls();
		});
		it('queries relevant data and not workshop or hearing data by default by case id', async () => {
			const expectedQuery = {
				where: {
					id: 'someCaseId'
				},
				include: {
					gateway1Info: true,
					gateway2Info: {
						include: {
							workshops: false
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
							hearings: false
						}
					},
					contacts: true,
					lpas: true
				}
			};
			await dataMapper.mapData({ caseId: 'someCaseId' }, false, false);
			assert.deepEqual(service.db.case.findUnique.mock.calls.at(0)?.arguments.at(0), expectedQuery);
		});
		it('queries workshop data when requested', async () => {
			const expectedQuery = {
				where: {
					id: 'someCaseId'
				},
				include: {
					gateway1Info: true,
					gateway2Info: {
						include: {
							workshops: true
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
							hearings: false
						}
					},
					contacts: true,
					lpas: true
				}
			};
			await dataMapper.mapData({ caseId: 'someCaseId' }, true, false);
			assert.deepEqual(service.db.case.findUnique.mock.calls.at(0)?.arguments.at(0), expectedQuery);
		});
		it('queries hearing data when requested', async () => {
			const expectedQuery = {
				where: {
					id: 'someCaseId'
				},
				include: {
					gateway1Info: true,
					gateway2Info: {
						include: {
							workshops: false
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
							hearings: true
						}
					},
					contacts: true,
					lpas: true
				}
			};
			await dataMapper.mapData({ caseId: 'someCaseId' }, false, true);
			assert.deepEqual(service.db.case.findUnique.mock.calls.at(0)?.arguments.at(0), expectedQuery);
		});
		it('rejects when there is no data', async () => {
			const serviceCopy = {
				db: {
					case: {
						findUnique: mock.fn(async () => null)
					}
				}
			};
			const dm = new ODWDataMapper(serviceCopy as unknown as BaseService<PrismaClient>);
			await assert.rejects(async () => {
				await dm.mapData({ caseId: 'someCaseId' }, false, false);
			});
		});
		it('does not map workshop or hearing data when not requested', async () => {
			const expectedResult = {
				case: mockPlanCaseResponse,
				events: []
			};
			const actualResult = await dataMapper.mapData({ caseId: 'someCaseId' }, false, false);
			assert.deepEqual(actualResult, expectedResult);
			assert.deepEqual(mockMapPlanCase.mock.calls.at(0)?.arguments.at(0), mockDBResult);
			assert.deepEqual(mockMapPlanWorkshop.mock.calls.length, 0);
			assert.deepEqual(mockMapPlanHearing.mock.calls.length, 0);
		});
		it('maps workshop data when requested', async () => {
			const expectedResult = {
				case: mockPlanCaseResponse,
				events: [
					{
						addressCounty: null,
						addressLine1: null,
						addressLine2: null,
						addressPostcode: null,
						addressTown: null,
						caseId: 'someCaseId',
						caseReference: 'someCaseReference',
						eventEndDateTime: null,
						eventLocationType: 'virtual',
						eventStartDateTime: null,
						eventType: 'gateway_2_workshop',
						id: 'someWorkshopId',
						venueName: 'someVenue'
					}
				]
			};
			const actualResult = await dataMapper.mapData({ caseId: 'someCaseId' }, true, false);
			assert.deepEqual(actualResult, expectedResult);
			assert.deepEqual(mockMapPlanCase.mock.calls.at(0)?.arguments.at(0), mockDBResult);
			assert.deepEqual(mockMapPlanWorkshop.mock.calls.at(0)?.arguments.at(0), mockDBResult);
			assert.deepEqual(mockMapPlanHearing.mock.calls.length, 0);
		});
		it('maps hearing data when requested', async () => {
			const expectedResult = {
				case: mockPlanCaseResponse,
				events: [
					{
						addressCounty: null,
						addressLine1: null,
						addressLine2: null,
						addressPostcode: null,
						addressTown: null,
						caseId: 'someCaseId',
						caseReference: 'someCaseReference',
						eventEndDateTime: null,
						eventLocationType: 'virtual',
						eventStartDateTime: null,
						eventType: 'examination_hearing',
						id: 'someHearingId',
						venueName: 'someVenue'
					}
				]
			};
			const actualResult = await dataMapper.mapData({ caseId: 'someCaseId' }, false, true);
			assert.deepEqual(actualResult, expectedResult);
			assert.deepEqual(mockMapPlanCase.mock.calls.at(0)?.arguments.at(0), mockDBResult);
			assert.deepEqual(mockMapPlanWorkshop.mock.calls.length, 0);
			assert.deepEqual(mockMapPlanHearing.mock.calls.at(0)?.arguments.at(0), mockDBResult);
		});
	});
	describe('test mapPlanCase', async () => {
		it('should return the correct result', () => {
			const dataMapper = new ODWDataMapperWrapper({} as unknown as BaseService<PrismaClient>);
			const expectedResult = {
				actualSubmissionForExaminationDate: '2026-01-16T00:00:00.000Z',
				adoptionDate: '2026-01-29T00:00:00.000Z',
				approvedForCilDate: '2026-01-30T00:00:00.000Z',
				caseOfficerId: ['someCaseOfficer'],
				caseProgrammeOfficer: null,
				caseReference: 'someCaseReference',
				completionDate: '2026-02-01T00:00:00.000Z',
				createdDate: '2026-01-03T00:00:00.000Z',
				deletedDate: '2026-01-04T00:00:00.000Z',
				dsaCurrentAndValid: true,
				examinationOutcome: 'Sound',
				examinationOutcomeDate: '2026-01-28T00:00:00.000Z',
				examinationWebsite: 'someUrl',
				examiningInspectorId: null,
				expectedPublicationDate: null,
				expectedSubmissionForExaminationDate: '2026-01-02T00:00:00.000Z',
				factCheckActualDate: '2026-01-24T00:00:00.000Z',
				factCheckDateReceivedFromInspector: '2026-01-22T00:00:00.000Z',
				factCheckDueDate: '2026-01-23T00:00:00.000Z',
				factCheckReceivedBackFromLPADate: '2026-01-25T00:00:00.000Z',
				finalReportIssueDate: '2026-01-26T00:00:00.000Z',
				gateway1ActualDate: '2026-01-06T00:00:00.000Z',
				gateway1ExpectedDate: '2026-01-05T00:00:00.000Z',
				gateway2ActualDate: '2026-01-10T00:00:00.000Z',
				gateway2AssessorId: null,
				gateway2ExpectedDate: '2026-01-09T00:00:00.000Z',
				gateway2ReportIssuedDate: '2026-01-11T00:00:00.000Z',
				gateway3ActualDate: '2026-01-15T00:00:00.000Z',
				gateway3AssessorId: null,
				gateway3ExpectedDate: '2026-01-14T00:00:00.000Z',
				id: 'someCaseId',
				intentionToCommenceDate: '2026-01-01T00:00:00.000Z',
				letterIssueDate: '2026-01-18T00:00:00.000Z',
				letterSentToMHCLGDate: '2026-01-17T00:00:00.000Z',
				lpaContact: [
					{
						emailAddress: 'someEmail',
						endDate: null,
						firstName: 'jim',
						id: 'contact1',
						lastName: 'bob',
						phone: '0123456789',
						pinsLpaCode: 'someLPACode',
						startDate: ''
					}
				],
				lpaId: ['a', 'b', 'c'],
				panelresponseToInspectorDate: '2026-01-21T00:00:00.000Z',
				pauses: [
					{
						endDate: '2026-02-04T00:00:00.000Z',
						id: 'pause1',
						startDate: '2026-02-03T00:00:00.000Z'
					},
					{
						endDate: '2026-02-07T00:00:00.000Z',
						id: 'pause2',
						startDate: '2026-02-06T00:00:00.000Z'
					}
				],
				planBand: 1,
				planTitle: 'somePlanTitle',
				planType: 'local_plans',
				qaDate: '2026-01-19T00:00:00.000Z',
				qaInspectorId: null,
				reportPublishedByLpaDate: '2026-01-12T00:00:00.000Z',
				reportSentToPanelDate: '2026-01-20T00:00:00.000Z',
				slaReceivedDate: '2026-01-08T00:00:00.000Z',
				slaSentDate: '2026-01-07T00:00:00.000Z',
				withdrawnDate: '2026-01-27T00:00:00.000Z',
				workshopDocumentUploadedDate: '2026-01-13T00:00:00.000Z'
			};
			const actualResult = dataMapper.mapPlanCaseWrapper(mockDBResult as any);
			assert.deepEqual(actualResult, expectedResult);
		});
	});
	describe('test mapPlanWorkshop', () => {
		it('should return the correct result', () => {
			const dataMapper = new ODWDataMapperWrapper({} as unknown as BaseService<PrismaClient>);
			const expectedResult = [
				{
					addressCounty: null,
					addressLine1: 'someAddress1',
					addressLine2: 'someAddress2',
					addressPostcode: 'somePostcode',
					addressTown: 'someTown',
					caseId: 'someCaseId',
					caseReference: 'someCaseReference',
					eventEndDateTime: '2026-02-15T00:00:00.000Z',
					eventLocationType: 'virtual',
					eventStartDateTime: '2026-02-10T00:00:00.000Z',
					eventType: 'gateway_2_workshop',
					id: 'workshop1',
					venueName: 'someVenue'
				}
			];
			const actualResult = dataMapper.mapPlanWorkshopWrapper(mockDBResult as any);
			assert.deepEqual(actualResult, expectedResult);
		});
	});
	describe('test mapPlanHearing', () => {
		const dataMapper = new ODWDataMapperWrapper({} as unknown as BaseService<PrismaClient>);
		const expectedResult = [
			{
				addressCounty: null,
				addressLine1: 'address1',
				addressLine2: 'address2',
				addressPostcode: 'somePostcode',
				addressTown: 'someTown',
				caseId: 'someCaseId',
				caseReference: 'someCaseReference',
				eventEndDateTime: '2026-02-10T00:00:00.000Z',
				eventLocationType: 'virtual',
				eventStartDateTime: '2026-02-09T00:00:00.000Z',
				eventType: 'examination_hearing',
				id: 'hearingId',
				venueName: 'someVenue'
			}
		];
		const actualResult = dataMapper.mapPlanHearingWrapper(mockDBResult as any);
		assert.deepEqual(actualResult, expectedResult);
	});
});
