import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

export function getExaminationStatusForDisplay(
	status: string,
	examiningInspectors: readonly (string | null | undefined)[] = []
): string {
	if (
		status === EXAMINATION_STATUS_ID.SUBMITTED &&
		examiningInspectors.some((inspector) => typeof inspector === 'string' && inspector.trim().length > 0)
	) {
		return EXAMINATION_STATUS_ID.IN_EXAMINATION;
	}

	return status;
}
