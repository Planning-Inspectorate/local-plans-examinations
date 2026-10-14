import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/case.ts';
import type { DocumentModel, Gateway3SubmissionModel } from '@pins/local-plans-database/src/client/models.ts';
import {
	type ExaminationStage,
	getPlanStatusClasses,
	resolveCaseHeaderStatus,
	resolveExaminationStage
} from './status-tag-classes.ts';

const makeDocument = (overrides: Partial<DocumentModel> = {}): DocumentModel => ({
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	name: 'gateway-3-document.pdf',
	caseId: 'case-1',
	guid: 'document-1',
	documentSetId: DOCUMENT_SET_ID.G3_PROPOSED_LOCAL_PLAN,
	isDeleted: false,
	latestVersionId: null,
	...overrides
});

const makeSubmission = (overrides: Partial<Gateway3SubmissionModel> = {}): Gateway3SubmissionModel => ({
	id: 'submission-1',
	decision: null,
	completionDate: null,
	gateway3InfoId: 'gateway-3-info-1',
	...overrides
});

describe('getPlanStatusClasses', () => {
	it('returns the mapped GOV.UK class for a known status', () => {
		assert.equal(getPlanStatusClasses('Awaiting SLA'), 'govuk-tag--yellow');
		assert.equal(getPlanStatusClasses('GW2 received'), 'govuk-tag--turquoise');
		assert.equal(getPlanStatusClasses('Completed'), 'govuk-tag--green');
	});

	it('falls back to turquoise for unknown statuses', () => {
		assert.equal(getPlanStatusClasses('Some weird status'), 'govuk-tag--turquoise');
	});
});

describe('resolveCaseHeaderStatus', () => {
	it('keeps GW3 pending when documents are uploaded but not submitted', () => {
		const gateway2Report = makeDocument({
			guid: 'gateway-2-report',
			documentSetId: DOCUMENT_SET_ID.G2_REPORT
		});

		const result = resolveCaseHeaderStatus([gateway2Report], [makeDocument()], null, null, [makeSubmission()]);

		assert.equal(result.headerStatusText, 'GW3 pending');
	});

	it('returns GW3 received when Gateway 3 documents have been submitted', () => {
		const result = resolveCaseHeaderStatus([], [makeDocument()], null, null, [
			makeSubmission({ completionDate: new Date('2026-01-02T00:00:00.000Z') })
		]);

		assert.equal(result.headerStatusText, 'GW3 received');
	});

	it('returns GW3 pending after a resubmission-required decision', () => {
		const rejectedAt = new Date('2026-01-01T00:00:00.000Z');
		const rejectedSubmission = makeSubmission({
			decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
			completionDate: rejectedAt
		});
		const newSubmission = makeSubmission({
			id: 'submission-2'
		});
		const originalDocument = makeDocument({ createdAt: new Date('2025-12-01T00:00:00.000Z') });

		const result = resolveCaseHeaderStatus([], [originalDocument], null, null, [rejectedSubmission, newSubmission]);

		assert.equal(result.headerStatusText, 'GW3 pending');
	});

	it('returns GW3 received after documents are resubmitted', () => {
		const rejectedAt = new Date('2026-01-01T00:00:00.000Z');
		const rejectedSubmission = makeSubmission({
			decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
			completionDate: rejectedAt
		});
		const newSubmission = makeSubmission({ id: 'submission-2' });
		const resubmittedDocument = makeDocument({ createdAt: new Date('2026-01-02T00:00:00.000Z') });

		const result = resolveCaseHeaderStatus([], [resubmittedDocument], null, null, [rejectedSubmission, newSubmission]);

		assert.equal(result.headerStatusText, 'GW3 received');
	});

	it('returns Submission pending after a pass decision', () => {
		const result = resolveCaseHeaderStatus([], [makeDocument()], null, null, [
			makeSubmission({
				decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION,
				completionDate: new Date('2026-01-02T00:00:00.000Z')
			})
		]);

		assert.equal(result.headerStatusText, 'Submission pending');
	});

	it('returns Awaiting SLA when no SLA has been received', () => {
		const result = resolveCaseHeaderStatus(
			[],
			[],
			{
				id: '1',
				caseId: 'case-1',
				noticeOfIntention: null,
				expectedGateway1Date: null,
				completedGateway1Date: null,
				slaSentDate: null,
				slaReceivedDate: null,
				dsaChecked: null
			},
			null,
			[]
		);

		assert.deepEqual(result, {
			headerStatusText: 'Awaiting SLA',
			headerStatusClasses: 'govuk-tag--yellow'
		});
	});

	it('returns GW2 pending when the SLA has been received', () => {
		const result = resolveCaseHeaderStatus(
			[],
			[],
			{
				id: '1',
				caseId: 'case-1',
				noticeOfIntention: null,
				expectedGateway1Date: null,
				completedGateway1Date: null,
				slaSentDate: null,
				slaReceivedDate: new Date(),
				dsaChecked: null
			},
			null,
			[]
		);

		assert.deepEqual(result, {
			headerStatusText: 'GW2 pending',
			headerStatusClasses: 'govuk-tag--yellow'
		});
	});

	it('returns GW2 workshop confirmed when the workshop is in the future', () => {
		const futureDate = new Date(Date.now() + 60_000);

		const result = resolveCaseHeaderStatus(
			[],
			[],
			{
				id: '1',
				caseId: 'case-1',
				noticeOfIntention: null,
				expectedGateway1Date: null,
				completedGateway1Date: null,
				slaSentDate: null,
				slaReceivedDate: new Date(),
				dsaChecked: null
			},
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: new Date(),
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshopDocumentUploadedDate: null,
				workshops: [
					{
						id: 'workshop_g2',
						gateway2InfoId: 'g2',
						createdDate: new Date(),
						workshopDate: futureDate,
						workshopTime: null,
						workshopEndTime: null,
						workshopExpectedDaysKnown: null,
						workshopExpectedDays: null,
						workshopLocationType: null,
						remoteMeetingLinkKnown: null,
						remoteMeetingLink: null,
						workshopLocationKnown: null,
						workshopVenueName: 'Somewhere',
						workshopAddressLine: null,
						workshopAddressLine2: null,
						workshopTownOrCity: null,
						workshopPostcode: null
					}
				]
			},
			[]
		);

		assert.deepEqual(result, {
			headerStatusText: 'GW2 workshop confirmed',
			headerStatusClasses: 'govuk-tag--blue'
		});
	});

	it('returns GW2 report when the workshop date has passed and no report exists', () => {
		const pastDate = new Date(Date.now() - 60_000);

		const result = resolveCaseHeaderStatus(
			[],
			[],
			{
				id: '1',
				caseId: 'case-1',
				noticeOfIntention: null,
				expectedGateway1Date: null,
				completedGateway1Date: null,
				slaSentDate: null,
				slaReceivedDate: new Date(),
				dsaChecked: null
			},
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: new Date(),
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshopDocumentUploadedDate: null,
				workshops: [
					{
						id: 'workshop_g2',
						gateway2InfoId: 'g2',
						createdDate: new Date(),
						workshopDate: pastDate,
						workshopTime: null,
						workshopEndTime: null,
						workshopExpectedDaysKnown: null,
						workshopExpectedDays: null,
						workshopLocationType: null,
						remoteMeetingLinkKnown: null,
						remoteMeetingLink: null,
						workshopLocationKnown: null,
						workshopVenueName: 'Somewhere',
						workshopAddressLine: null,
						workshopAddressLine2: null,
						workshopTownOrCity: null,
						workshopPostcode: null
					}
				]
			},
			[]
		);

		assert.deepEqual(result, {
			headerStatusText: 'GW2 report',
			headerStatusClasses: 'govuk-tag--blue'
		});
	});

	it('returns GW2 received when gateway 2 documents exist and no workshop data exists', () => {
		const result = resolveCaseHeaderStatus(
			[
				{
					createdAt: new Date(),
					name: 'doc',
					caseId: 'case-1',
					guid: 'guid-1',
					documentSetId: 'some-set',
					isDeleted: false,
					latestVersionId: null
				}
			],
			[],
			{
				id: '1',
				caseId: 'case-1',
				noticeOfIntention: null,
				expectedGateway1Date: null,
				completedGateway1Date: null,
				slaSentDate: null,
				slaReceivedDate: new Date(),
				dsaChecked: null
			},
			null,
			[]
		);

		assert.deepEqual(result, {
			headerStatusText: 'GW2 received',
			headerStatusClasses: 'govuk-tag--turquoise'
		});
	});

	it('returns GW2 workshop confirmed for a future remote workshop without a physical venue', () => {
		const futureDate = new Date(Date.now() + 60_000);

		const result = resolveCaseHeaderStatus(
			[
				{
					createdAt: new Date(),
					name: 'doc',
					caseId: 'case-1',
					guid: 'guid-1',
					documentSetId: 'some-set',
					isDeleted: false,
					latestVersionId: null
				}
			],
			[],
			{
				id: '1',
				caseId: 'case-1',
				noticeOfIntention: null,
				expectedGateway1Date: null,
				completedGateway1Date: null,
				slaSentDate: null,
				slaReceivedDate: new Date(),
				dsaChecked: null
			},
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: null,
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshopDocumentUploadedDate: null,
				workshops: [
					{
						id: 'workshop_g2',
						gateway2InfoId: 'g2',
						createdDate: new Date(),
						workshopDate: futureDate,
						workshopTime: null,
						workshopEndTime: null,
						workshopExpectedDaysKnown: null,
						workshopExpectedDays: null,
						workshopLocationType: 'remote',
						remoteMeetingLinkKnown: 'yes',
						remoteMeetingLink: 'https://example.com/workshop',
						workshopLocationKnown: null,
						workshopVenueName: null,
						workshopAddressLine: null,
						workshopAddressLine2: null,
						workshopTownOrCity: null,
						workshopPostcode: null
					}
				]
			},
			[]
		);

		assert.deepEqual(result, {
			headerStatusText: 'GW2 workshop confirmed',
			headerStatusClasses: 'govuk-tag--blue'
		});
	});

	it('returns GW2 pending when there are no workshops or gateway 2 documents', () => {
		const result = resolveCaseHeaderStatus(
			[],
			[],
			{
				id: '1',
				caseId: 'case-1',
				noticeOfIntention: null,
				expectedGateway1Date: null,
				completedGateway1Date: null,
				slaSentDate: null,
				slaReceivedDate: new Date(),
				dsaChecked: null
			},
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: new Date(),
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshopDocumentUploadedDate: null,
				workshops: []
			},
			[]
		);

		assert.deepEqual(result, {
			headerStatusText: 'GW2 pending',
			headerStatusClasses: 'govuk-tag--yellow'
		});
	});
	it('returns GW2 report when the workshop date has passed and gateway 2 documents exist', () => {
		const pastDate = new Date(Date.now() - 60_000);

		const result = resolveCaseHeaderStatus(
			[
				{
					createdAt: new Date(),
					name: 'doc',
					caseId: 'case-1',
					guid: 'guid-1',
					documentSetId: 'some-set',
					isDeleted: false,
					latestVersionId: null
				}
			],
			[],
			{
				id: '1',
				caseId: 'case-1',
				noticeOfIntention: null,
				expectedGateway1Date: null,
				completedGateway1Date: null,
				slaSentDate: null,
				slaReceivedDate: new Date(),
				dsaChecked: null
			},
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: new Date(),
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshopDocumentUploadedDate: null,
				workshops: [
					{
						id: 'workshop_g2',
						gateway2InfoId: 'g2',
						createdDate: new Date(),
						workshopDate: pastDate,
						workshopTime: null,
						workshopEndTime: null,
						workshopExpectedDaysKnown: null,
						workshopExpectedDays: null,
						workshopLocationType: null,
						remoteMeetingLinkKnown: null,
						remoteMeetingLink: null,
						workshopLocationKnown: null,
						workshopVenueName: 'Somewhere',
						workshopAddressLine: null,
						workshopAddressLine2: null,
						workshopTownOrCity: null,
						workshopPostcode: null
					}
				]
			},
			[]
		);

		assert.deepEqual(result, {
			headerStatusText: 'GW2 report',
			headerStatusClasses: 'govuk-tag--blue'
		});
	});

	it('returns GW3 pending when a G2 report document exists', () => {
		const result = resolveCaseHeaderStatus(
			[
				{
					createdAt: new Date(),
					name: 'g2-report',
					caseId: 'case-1',
					guid: 'guid-1',
					documentSetId: DOCUMENT_SET_ID.G2_REPORT,
					isDeleted: false,
					latestVersionId: null
				}
			],
			[],
			{
				id: '1',
				caseId: 'case-1',
				noticeOfIntention: null,
				expectedGateway1Date: null,
				completedGateway1Date: null,
				slaSentDate: null,
				slaReceivedDate: new Date(),
				dsaChecked: null
			},
			null,
			[]
		);

		assert.deepEqual(result, {
			headerStatusText: 'GW3 pending',
			headerStatusClasses: 'govuk-tag--yellow'
		});
	});

	it('ignores deleted gateway 2 documents', () => {
		const result = resolveCaseHeaderStatus(
			[
				{
					createdAt: new Date(),
					name: 'doc',
					caseId: 'case-1',
					guid: 'guid-1',
					documentSetId: 'some-set',
					isDeleted: true,
					latestVersionId: null
				},
				{
					createdAt: new Date(),
					name: 'g2-report',
					caseId: 'case-1',
					guid: 'guid-2',
					documentSetId: DOCUMENT_SET_ID.G2_REPORT,
					isDeleted: true,
					latestVersionId: null
				}
			],
			[],
			{
				id: '1',
				caseId: 'case-1',
				noticeOfIntention: null,
				expectedGateway1Date: null,
				completedGateway1Date: null,
				slaSentDate: null,
				slaReceivedDate: new Date(),
				dsaChecked: null
			},
			null,
			[]
		);

		assert.deepEqual(result, {
			headerStatusText: 'GW2 pending',
			headerStatusClasses: 'govuk-tag--yellow'
		});
	});

	it('should update status for examination (Exam in progress)', () => {
		const DATE = '2026-01-01';
		const pastDate = new Date(Date.now() - 60_000);
		const examinationStatus: ExaminationStage = {
			examiningInspector1: 'Alice'
			// examiningInspector2: 'Alice',
			// examiningInspector3: 'Alice'
			// qaInspector1: 'Bob',
			// qaInspector2: 'Bob',
			// qaInspector3: 'Bob',
			// planResponseToInspectorDate: undefined,
			// planPauseStartDate: null,
			// planPauseEndDate: null,
			// finalReportIssueDate: null,
			// adoptionDate: null
		};
		const resolvedCaseHeaderStatus = resolveCaseHeaderStatus(
			[],
			[
				{
					isDeleted: false
				} as DocumentModel
			],
			null,
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: new Date(),
				workshopVenue: 'Somewhere',
				workshopDate: pastDate,
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshops: [],
				workshopDocumentUploadedDate: null
			},
			[
				{
					decision: '1',
					completionDate: DATE
				} as unknown as Gateway3SubmissionModel
			],
			examinationStatus
		);

		assert.deepEqual(resolvedCaseHeaderStatus, {
			headerStatusText: 'Exam in progress',
			headerStatusClasses: 'govuk-tag--blue'
		});
	});

	it('should update status for examination (Exam in progress check if Inspector 2 is assigned.)', () => {
		const DATE = '2026-01-01';
		const pastDate = new Date(Date.now() - 60_000);
		const examinationStatus: ExaminationStage = {
			examiningInspector2: 'Alice'
		};
		const resolvedCaseHeaderStatus = resolveCaseHeaderStatus(
			[],
			[
				{
					isDeleted: false
				} as DocumentModel
			],
			null,
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: new Date(),
				workshopVenue: 'Somewhere',
				workshopDate: pastDate,
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshops: [],
				workshopDocumentUploadedDate: null
			},
			[
				{
					decision: '1',
					completionDate: DATE
				} as unknown as Gateway3SubmissionModel
			],
			examinationStatus
		);

		assert.deepEqual(resolvedCaseHeaderStatus, {
			headerStatusText: 'Exam in progress',
			headerStatusClasses: 'govuk-tag--blue'
		});
	});

	it('should update status for examination (QA)', () => {
		const DATE = '2026-01-01';
		const pastDate = new Date(Date.now() - 60_000);

		const examinationStatus: ExaminationStage = {
			qaInspector1: 'Alice'
		};

		const resolvedCaseHeaderStatus = resolveCaseHeaderStatus(
			[],
			[
				{
					isDeleted: false
				} as DocumentModel
			],
			null,
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: new Date(),
				workshopVenue: 'Somewhere',
				workshopDate: pastDate,
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshops: [],
				workshopDocumentUploadedDate: null
			},
			[
				{
					decision: '1',
					completionDate: DATE
				} as unknown as Gateway3SubmissionModel
			],
			examinationStatus
		);

		assert.deepEqual(resolvedCaseHeaderStatus, {
			headerStatusText: 'QA',
			headerStatusClasses: 'govuk-tag--blue'
		});
	});

	it('should update status for examination (Fact check)', () => {
		const DATE = '2026-01-01';
		const pastDate = new Date(Date.now() - 60_000);

		const examinationStatus: ExaminationStage = {
			qaInspector1: 'Alice',
			planResponseToInspectorDate: DATE
		};

		const resolvedCaseHeaderStatus = resolveCaseHeaderStatus(
			[],
			[
				{
					isDeleted: false
				} as DocumentModel
			],
			null,
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: new Date(),
				workshopVenue: 'Somewhere',
				workshopDate: pastDate,
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshops: [],
				workshopDocumentUploadedDate: null
			},
			[
				{
					decision: '1',
					completionDate: DATE
				} as unknown as Gateway3SubmissionModel
			],
			examinationStatus
		);

		assert.deepEqual(resolvedCaseHeaderStatus, {
			headerStatusText: 'Fact check',
			headerStatusClasses: 'govuk-tag--turquoise'
		});
	});

	it('should update status for examination (Report issued)', () => {
		const DATE = '2026-01-01';
		const pastDate = new Date(Date.now() - 60_000);

		const examinationStatus: ExaminationStage = {
			finalReportIssueDate: DATE
		};

		const resolvedCaseHeaderStatus = resolveCaseHeaderStatus(
			[],
			[
				{
					isDeleted: false
				} as DocumentModel
			],
			null,
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: new Date(),
				workshopVenue: 'Somewhere',
				workshopDate: pastDate,
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshops: [],
				workshopDocumentUploadedDate: null
			},
			[
				{
					decision: '1',
					completionDate: DATE
				} as unknown as Gateway3SubmissionModel
			],
			examinationStatus
		);

		assert.deepEqual(resolvedCaseHeaderStatus, {
			headerStatusText: 'Report issued',
			headerStatusClasses: 'govuk-tag--turquoise'
		});
	});

	it('should update status for examination (Plan adopted)', () => {
		const DATE = '2026-01-01';
		const pastDate = new Date(Date.now() - 60_000);

		const examinationStatus: ExaminationStage = {
			adoptionDate: DATE
		};

		const resolvedCaseHeaderStatus = resolveCaseHeaderStatus(
			[],
			[
				{
					isDeleted: false
				} as DocumentModel
			],
			null,
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: new Date(),
				workshopVenue: 'Somewhere',
				workshopDate: pastDate,
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshops: [],
				workshopDocumentUploadedDate: null
			},
			[
				{
					decision: '1',
					completionDate: DATE
				} as unknown as Gateway3SubmissionModel
			],
			examinationStatus
		);

		assert.deepEqual(resolvedCaseHeaderStatus, {
			headerStatusText: 'Plan adopted',
			headerStatusClasses: 'govuk-tag--green'
		});
	});

	it('should update status for examination (Paused)', () => {
		const DATE = '2026-01-01';
		const pastDate = new Date(Date.now() - 60_000);

		const examinationStatus: ExaminationStage = {
			adoptionDate: DATE,
			planPauseStartDate: DATE
		};

		const resolvedCaseHeaderStatus = resolveCaseHeaderStatus(
			[],
			[
				{
					isDeleted: false
				} as DocumentModel
			],
			null,
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: new Date(),
				workshopVenue: 'Somewhere',
				workshopDate: pastDate,
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshops: [],
				workshopDocumentUploadedDate: null
			},
			[
				{
					decision: '1',
					completionDate: DATE
				} as unknown as Gateway3SubmissionModel
			],
			examinationStatus
		);

		assert.deepEqual(resolvedCaseHeaderStatus, {
			headerStatusText: 'Paused',
			headerStatusClasses: 'govuk-tag--grey'
		});
	});

	it('should update status for examination, return the last state when a has pause ended (Paused ended)', () => {
		const DATE = '2026-01-01';
		const pastDate = new Date(Date.now() - 60_000);

		const examinationStatusPaused: ExaminationStage = {
			finalReportIssueDate: DATE,
			planPauseStartDate: DATE
		};

		const examinationStatusPausedEnded: ExaminationStage = {
			finalReportIssueDate: DATE,
			planPauseStartDate: DATE,
			planPauseEndDate: DATE
		};

		const resolvedCaseHeaderStatusPaused = resolveCaseHeaderStatus(
			[],
			[
				{
					isDeleted: false
				} as DocumentModel
			],
			null,
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: new Date(),
				workshopVenue: 'Somewhere',
				workshopDate: pastDate,
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshops: [],
				workshopDocumentUploadedDate: null
			},
			[
				{
					decision: '1',
					completionDate: DATE
				} as unknown as Gateway3SubmissionModel
			],
			examinationStatusPaused
		);

		const resolvedCaseHeaderStatusPausedEnded = resolveCaseHeaderStatus(
			[],
			[
				{
					isDeleted: false
				} as DocumentModel
			],
			null,
			{
				id: 'g2',
				caseId: 'case-1',
				actualDate: new Date(),
				workshopVenue: 'Somewhere',
				workshopDate: pastDate,
				assessorName: 'Assessor',
				expectedDate: null,
				validDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshops: [],
				workshopDocumentUploadedDate: null
			},
			[
				{
					decision: '1',
					completionDate: DATE
				} as unknown as Gateway3SubmissionModel
			],
			examinationStatusPausedEnded
		);

		assert.deepEqual(resolvedCaseHeaderStatusPaused, {
			headerStatusText: 'Paused',
			headerStatusClasses: 'govuk-tag--grey'
		});

		assert.deepEqual(resolvedCaseHeaderStatusPausedEnded, {
			headerStatusText: 'Report issued',
			headerStatusClasses: 'govuk-tag--turquoise'
		});
	});
});

describe('resolveExaminationStage', () => {
	const DATE = '2026-01-01';
	const resolve = (status: ExaminationStage | null) => resolveExaminationStage(status, true);

	describe('single stage set', () => {
		const cases = [
			['examiningInspector1', 'Exam in progress'],
			['examiningInspector2', 'Exam in progress'],
			['examiningInspector3', 'Exam in progress'],
			['qaInspector1', 'QA'],
			['qaInspector2', 'QA'],
			['qaInspector3', 'QA'],
			['planResponseToInspectorDate', 'Fact check'],
			['finalReportIssueDate', 'Report issued'],
			['adoptionDate', 'Plan adopted']
		] as const;

		for (const [field, expected] of cases) {
			it(`${field} -> ${expected}`, () => {
				assert.equal(resolve({ [field]: DATE }), expected);
			});
		}
	});

	describe('stage order', () => {
		const ordered = [
			['examiningInspector1', 'Exam in progress'],
			['qaInspector1', 'QA'],
			['planResponseToInspectorDate', 'Fact check'],
			['finalReportIssueDate', 'Report issued'],
			['adoptionDate', 'Plan adopted']
		] as const;

		ordered.forEach(([, expected], i) => {
			it(`returns ${expected} when it and every earlier stage are set`, () => {
				const status = Object.fromEntries(ordered.slice(0, i + 1).map(([field]) => [field, DATE]));
				assert.equal(resolve(status), expected);
			});
		});

		it('does not depend on field order in the object', () => {
			assert.equal(resolve({ adoptionDate: DATE, examiningInspector1: 'Alice' }), 'Plan adopted');
		});

		it('picks plan adopted when every field is set', () => {
			assert.equal(
				resolve({
					examiningInspector1: 'Alice',
					examiningInspector2: 'Alice',
					examiningInspector3: 'Alice',
					qaInspector1: 'Bob',
					qaInspector2: 'Bob',
					qaInspector3: 'Bob',
					planResponseToInspectorDate: DATE,
					planPauseStartDate: DATE,
					planPauseEndDate: DATE,
					finalReportIssueDate: DATE,
					adoptionDate: DATE
				}),
				'Plan adopted'
			);
		});
	});

	describe('pauses', () => {
		it('returns Paused when a pause has started but not ended', () => {
			assert.equal(resolve({ planPauseStartDate: DATE }), 'Paused');
		});

		it('returns Paused even when a later stage is set', () => {
			assert.equal(resolve({ qaInspector1: 'Bob', adoptionDate: DATE, planPauseStartDate: DATE }), 'Paused');
		});

		it('returns null while paused if no pass decision has been given', () => {
			assert.equal(resolveExaminationStage({ planPauseStartDate: DATE }, false), null);
		});

		it('returns the stage before the pause once the pause has ended', () => {
			assert.equal(
				resolve({ planResponseToInspectorDate: DATE, planPauseStartDate: DATE, planPauseEndDate: DATE }),
				'Fact check'
			);
		});

		it('returns null when only an ended pause is set', () => {
			assert.equal(resolve({ planPauseStartDate: DATE, planPauseEndDate: DATE }), null);
		});

		it('returns null when only a pause end date is set', () => {
			assert.equal(resolve({ planPauseEndDate: DATE }), null);
		});
	});
});
