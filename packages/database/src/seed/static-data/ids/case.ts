export const PLAN_TYPE_ID = {
	LOCAL_PLAN: 'local-plan',
	OTHER: 'other'
} as const;

export const PLAN_BAND_ID = {
	BAND_1: '1',
	BAND_2: '2',
	BAND_3: '3'
} as const;

export const DSA_CHECKED_ID = {
	YES: 'yes',
	NO: 'no'
} as const;

export const GATEWAY_3_DECISION_ID = {
	PROCEED_TO_EXAMINATION: '1',
	RESUBMISSION_REQUIRED: '2'
} as const;

/// Progress statuses for a Gateway 3 submission stored on Gateway3Info.frontOfficeStatus.
export const GATEWAY_3_STATUS = {
	CANNOT_START_YET: 'CANNOT_START_YET',
	READY_TO_START: 'READY_TO_START',
	IN_PROGRESS: 'IN_PROGRESS',
	UNDER_REVIEW: 'UNDER_REVIEW',
	RESUBMISSION_REQUIRED: 'RESUBMISSION_REQUIRED',
	COMPLETED: 'COMPLETED'
} as const;

export type Gateway3Status = (typeof GATEWAY_3_STATUS)[keyof typeof GATEWAY_3_STATUS];
