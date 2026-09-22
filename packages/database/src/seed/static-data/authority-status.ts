import { AUTHORITY_STATUS_ID } from './ids/index.ts';

export const AUTHORITY_STATUSES = [
	{ id: AUTHORITY_STATUS_ID.LIVE, displayName: 'Live', displayOrder: 1 },
	{ id: AUTHORITY_STATUS_ID.INVALID, displayName: 'Invalid', displayOrder: 2 },
	{ id: AUTHORITY_STATUS_ID.TERMINATED, displayName: 'Terminated', displayOrder: 3 },
	{ id: AUTHORITY_STATUS_ID.UNKNOWN, displayName: 'Unknown', displayOrder: 4 }
];
