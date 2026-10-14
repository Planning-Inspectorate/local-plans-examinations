import type { CaseOverviewInput } from '../views/case/save/save-inputs.ts';
import { COMMON_CONSTS } from './common-consts.ts';

export type CaseRelation =
	typeof COMMON_CONSTS.GATEWAY_2_INFO | typeof COMMON_CONSTS.GATEWAY_3_INFO | typeof COMMON_CONSTS.EXAMINATION_INFO;

/** Fields that live in a related one-to-one table rather than the Case row itself.
 * `differingFieldName` is only needed where the answer key doesn't match the destination column name.
 */
export const FIELD_RELATIONS: Partial<
	Record<keyof CaseOverviewInput, { relation: CaseRelation; differingFieldName?: string }>
> = {
	assessorName: { relation: COMMON_CONSTS.GATEWAY_2_INFO },
	gateway3AssessorName: { relation: COMMON_CONSTS.GATEWAY_3_INFO, differingFieldName: 'assessorName' },
	programmeOfficerFirstName: { relation: COMMON_CONSTS.GATEWAY_3_INFO },
	programmeOfficerLastName: { relation: COMMON_CONSTS.GATEWAY_3_INFO },
	programmeOfficerEmail: { relation: COMMON_CONSTS.GATEWAY_3_INFO },
	examinationWebsite: { relation: COMMON_CONSTS.EXAMINATION_INFO },
	examiningInspector1: { relation: COMMON_CONSTS.EXAMINATION_INFO },
	examiningInspector2: { relation: COMMON_CONSTS.EXAMINATION_INFO },
	examiningInspector3: { relation: COMMON_CONSTS.EXAMINATION_INFO },
	qaInspector1: { relation: COMMON_CONSTS.EXAMINATION_INFO },
	qaInspector2: { relation: COMMON_CONSTS.EXAMINATION_INFO },
	qaInspector3: { relation: COMMON_CONSTS.EXAMINATION_INFO }
};

/** Contact/LPA answers are not nested inside of a Case, and are saved via their own DB calls. */
export const CONTACT_LPA_FIELDS = new Set<keyof CaseOverviewInput>([
	'lpa',
	'lpaCode',
	'lpaContact',
	'firstName',
	'lastName',
	'email',
	'phone'
]);

/** Some dates are created and saved when another field is saved.
 * e.g. when 'assessorName' is saved, 'assessorAppointmentDate' is automatically set.
 */
export const RELATION_APPOINTMENT_DATE_TRIGGERS: Record<CaseRelation, { triggerFields: string[]; dateField: string }> =
	{
		[COMMON_CONSTS.GATEWAY_2_INFO]: { triggerFields: ['assessorName'], dateField: 'assessorAppointmentDate' },
		[COMMON_CONSTS.GATEWAY_3_INFO]: { triggerFields: ['assessorName'], dateField: 'assessorAppointmentDate' },
		[COMMON_CONSTS.EXAMINATION_INFO]: {
			triggerFields: ['examiningInspector1', 'examiningInspector2', 'examiningInspector3'],
			dateField: 'examiningInspectorAppointmentDate'
		}
	};
