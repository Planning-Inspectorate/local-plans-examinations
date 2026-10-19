import { GATEWAY_3_STATUS } from './ids/index.ts';

export const Gateway3FrontOfficeStatuses = [
	{ id: GATEWAY_3_STATUS.CANNOT_START_YET, displayName: 'Cannot start yet' },
	{ id: GATEWAY_3_STATUS.READY_TO_START, displayName: 'Ready to start' },
	{ id: GATEWAY_3_STATUS.IN_PROGRESS, displayName: 'In progress' },
	{ id: GATEWAY_3_STATUS.UNDER_REVIEW, displayName: 'Under review' },
	{ id: GATEWAY_3_STATUS.RESUBMISSION_REQUIRED, displayName: 'Resubmission required' },
	{ id: GATEWAY_3_STATUS.COMPLETED, displayName: 'Completed' }
];
