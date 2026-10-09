import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/case.ts';
import type { DocumentModel, Gateway3SubmissionModel } from '@pins/local-plans-database/src/client/models.ts';
import { getPlanStatusClasses, resolveCaseHeaderStatus } from './status-tag-classes.ts';

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
				workshopVenue: 'Somewhere',
				workshopDate: futureDate,
				assessorName: 'Assessor',
				expectedDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshopDocumentUploadedDate: null
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
				workshopVenue: 'Somewhere',
				workshopDate: pastDate,
				assessorName: 'Assessor',
				expectedDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshopDocumentUploadedDate: null
			},
			[]
		);

		assert.deepEqual(result, {
			headerStatusText: 'GW2 report',
			headerStatusClasses: 'govuk-tag--blue'
		});
	});

	it('returns GW2 received when gateway 2 documents exist', () => {
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

	it('returns GW2 workshop confirmed when the workshop is in the future and gateway 2 documents exist', () => {
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
				workshopVenue: 'Somewhere',
				workshopDate: futureDate,
				assessorName: 'Assessor',
				expectedDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshopDocumentUploadedDate: null
			},
			[]
		);

		assert.deepEqual(result, {
			headerStatusText: 'GW2 workshop confirmed',
			headerStatusClasses: 'govuk-tag--blue'
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
				workshopVenue: 'Somewhere',
				workshopDate: pastDate,
				assessorName: 'Assessor',
				expectedDate: null,
				assessorAppointmentDate: null,
				reportIssuedDate: null,
				reportPublishedByLPA: null,
				workshopDocumentUploadedDate: null
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
});
