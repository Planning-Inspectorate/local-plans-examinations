import { EXAMINATION_STATUS_ID } from './ids/index.ts';

export const EXAMINATION_STATUSES = [
	{ id: EXAMINATION_STATUS_ID.CANNOT_START_YET, displayName: 'Cannot start yet', displayOrder: 1 },
	{ id: EXAMINATION_STATUS_ID.READY_TO_START, displayName: 'Ready to start', displayOrder: 2 },
	{ id: EXAMINATION_STATUS_ID.IN_PROGRESS, displayName: 'In progress', displayOrder: 3 },
	{ id: EXAMINATION_STATUS_ID.SUBMITTED, displayName: 'Submitted', displayOrder: 4 },
	{ id: EXAMINATION_STATUS_ID.IN_EXAMINATION, displayName: 'In examination', displayOrder: 5 },
	{ id: EXAMINATION_STATUS_ID.PAUSED, displayName: 'Paused', displayOrder: 6 },
	{ id: EXAMINATION_STATUS_ID.REPORT_ISSUED, displayName: 'Report issued', displayOrder: 7 },
	{ id: EXAMINATION_STATUS_ID.PLAN_ADOPTED, displayName: 'Plan adopted', displayOrder: 8 }
];
