import { VIRUS_CHECK_STATUS_ID } from './ids/index.ts';

export const VIRUS_CHECK_STATUSES = [
	{ id: VIRUS_CHECK_STATUS_ID.AFFECTED, displayName: 'Affected', displayOrder: 1 },
	{ id: VIRUS_CHECK_STATUS_ID.NOT_SCANNED, displayName: 'Not scanned', displayOrder: 2 },
	{ id: VIRUS_CHECK_STATUS_ID.SCANNED, displayName: 'Scanned', displayOrder: 3 }
];
