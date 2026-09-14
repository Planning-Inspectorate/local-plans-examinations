import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { getPlanStatusClasses, resolveCaseHeaderStatus } from './status-tag-classes.ts';

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
	it('returns Awaiting SLA when no SLA has been received', () => {
		const result = resolveCaseHeaderStatus(
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
				validDate: null,
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
				validDate: null,
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
			]
		);

		assert.deepEqual(result, {
			headerStatusText: 'GW2 received',
			headerStatusClasses: 'govuk-tag--turquoise'
		});
	});

	it('returns GW3 pending when a G2 report document exists', () => {
		const result = resolveCaseHeaderStatus(
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
			]
		);

		assert.deepEqual(result, {
			headerStatusText: 'GW3 pending',
			headerStatusClasses: 'govuk-tag--yellow'
		});
	});
});
