import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

export type ExaminationPause = {
	createdAt?: Date;
	planPauseDate: Date;
	planPauseEndDate: Date | null;
};

function pauseOrderDate(pause: ExaminationPause) {
	return (pause.createdAt ?? pause.planPauseDate).getTime();
}

export function getActiveExaminationPause(
	pauses: ExaminationPause[] | null | undefined,
	now = new Date()
): ExaminationPause | null {
	const latestPause = pauses?.toSorted((a, b) => pauseOrderDate(b) - pauseOrderDate(a))[0];
	if (!latestPause || latestPause.planPauseDate.getTime() > now.getTime()) {
		return null;
	}

	if (latestPause.planPauseEndDate && latestPause.planPauseEndDate.getTime() <= now.getTime()) {
		return null;
	}

	return latestPause;
}

export function getEffectiveExaminationStatus(
	status: string,
	pauses: ExaminationPause[] | null | undefined,
	now = new Date()
) {
	return getActiveExaminationPause(pauses, now) ? EXAMINATION_STATUS_ID.PAUSED : status;
}
