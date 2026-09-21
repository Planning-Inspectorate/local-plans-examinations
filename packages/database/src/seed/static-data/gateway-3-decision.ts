import { GATEWAY_3_DECISION_ID } from './ids/index.ts';

export const GATEWAY_3_DECISIONS = [
	{
		id: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION,
		displayName: 'Proceed to examination',
		displayOrder: 1
	},
	{
		id: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
		displayName: 'Resubmission required',
		displayOrder: 2
	}
];
