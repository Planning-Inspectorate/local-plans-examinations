import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

const EXAMINATION_STATUS_TAG_CLASSES: Record<string, string> = {
	[EXAMINATION_STATUS_ID.READY_TO_START]: 'govuk-tag govuk-tag--green',
	[EXAMINATION_STATUS_ID.IN_PROGRESS]: 'govuk-tag govuk-tag--blue',
	[EXAMINATION_STATUS_ID.SUBMITTED]: 'govuk-tag govuk-tag--yellow',
	[EXAMINATION_STATUS_ID.IN_EXAMINATION]: 'govuk-tag govuk-tag--blue',
	[EXAMINATION_STATUS_ID.PAUSED]: 'govuk-tag govuk-tag--grey',
	[EXAMINATION_STATUS_ID.REPORT_ISSUED]: 'govuk-tag govuk-tag--blue',
	[EXAMINATION_STATUS_ID.PLAN_ADOPTED]: 'govuk-tag govuk-tag--purple'
};

export function getExaminationStatusTagClass(status: string): string | undefined {
	return EXAMINATION_STATUS_TAG_CLASSES[status];
}
