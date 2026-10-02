import { SaveController } from './save-controller.ts';
import type { CaseOverviewInput } from './save-inputs.ts';
import { questions } from '../questions.ts';
import type { Prisma } from '@pins/local-plans-database/src/client/client.ts';
import {
	type CaseRelation,
	FIELD_RELATIONS,
	CONTACT_LPA_FIELDS,
	RELATION_APPOINTMENT_DATE_TRIGGERS
} from '../../../classes/case-field-mappings.ts';

export class OverviewSaveController extends SaveController {
	protected async prepareData(answers: Record<string, any>) {
		return this.trimStringValues(answers as CaseOverviewInput);
	}
	protected async shouldSaveToSession() {
		return false;
	}

	protected async saveToDatabase(answers: CaseOverviewInput) {
		const lpaName = (questions.lpa.options || []).find((opt: any) => opt.value === answers.lpa)?.text || '';
		const { caseFields, nestedData } = this.splitOverviewAnswers(answers);

		const hasContactFields =
			this.section === 'contacts' ||
			['firstName', 'lastName', 'phone', 'lpaContact', 'lpaCode'].some((key) => key in answers) ||
			(Boolean(this.currentItemId) && 'email' in answers);
		let updated = false;

		await this.service.db.$transaction(async (tx) => {
			let contactRecordChange;

			if (hasContactFields && this.currentItemId) {
				const contactData = this.buildContactData(answers, lpaName);
				if (this.section === 'contacts' && this.action === 'edit') {
					contactRecordChange = await tx.contact.update({ where: { id: this.currentItemId }, data: contactData });
				} else {
					contactRecordChange = await tx.contact.upsert({
						where: { id: this.currentItemId },
						create: { ...contactData, cases: { connect: { reference: this.caseReference } } },
						update: contactData
					});
				}
				updated = true;
			}

			const caseUpdate: Record<string, unknown> = { ...caseFields, ...this.buildNestedRelationUpdates(nestedData) };
			if (answers.lpa) {
				caseUpdate.lpas = {
					connectOrCreate: {
						where: { lpaCode: answers.lpa },
						create: { lpaCode: answers.lpa, lpaName }
					},
					disconnect: this.currentItemId ? [{ lpaCode: this.currentItemId }] : undefined
				};
			}

			let caseRecordChange;
			if (Object.keys(caseUpdate).length > 0) {
				caseRecordChange = await tx.case.update({ where: { reference: this.caseReference }, data: caseUpdate });
				updated = true;
			}

			return {
				contactRecordChange,
				caseRecordChange
			};
		});

		return updated;
	}
	/** A reusable `connectOrCreate` clause for an LPA by its code. */
	private lpaConnectOrCreate(lpaCode: string, lpaName: string): Prisma.LPACreateOrConnectWithoutContactsInput {
		return { where: { lpaCode }, create: { lpaCode, lpaName } };
	}

	/** Builds the shared contact `data` payload used by both create and update. */
	private buildContactData(formData: CaseOverviewInput, lpaName: string): Prisma.ContactCreateWithoutCasesInput {
		const { firstName = '', lastName = '', email = '', phone = '', lpaCode, lpaContact } = formData;
		return {
			firstName,
			lastName,
			email,
			phoneNumber: phone,
			lpa: { connectOrCreate: this.lpaConnectOrCreate(lpaCode || lpaContact || '', lpaName) }
		};
	}
	/** Splits flat overview answers into the Case row's own fields and any related-table buckets. */
	private splitOverviewAnswers(answers: CaseOverviewInput) {
		const caseFields: Record<string, unknown> = {};
		const nestedData: Partial<Record<CaseRelation, Record<string, unknown>>> = {};

		for (const [key, value] of Object.entries(answers)) {
			if (value === undefined || CONTACT_LPA_FIELDS.has(key as keyof CaseOverviewInput)) continue;

			const mapping = FIELD_RELATIONS[key as keyof CaseOverviewInput];
			if (!mapping) {
				caseFields[key] = value;
				continue;
			}
			const bucket = (nestedData[mapping.relation] ??= {});
			bucket[mapping.differingFieldName ?? key] = value;
		}

		return { caseFields, nestedData };
	}

	/** Builds the `{ relation: { upsert: { create, update } } }` payload for each related table touched. */
	private buildNestedRelationUpdates(nestedData: Partial<Record<CaseRelation, Record<string, unknown>>>) {
		const relationUpdates: Record<string, unknown> = {};

		for (const [relation, fields] of Object.entries(nestedData) as [CaseRelation, Record<string, unknown>][]) {
			const trigger = RELATION_APPOINTMENT_DATE_TRIGGERS[relation];
			if (trigger.triggerFields.some((field) => field in fields)) {
				fields[trigger.dateField] = new Date();
			}
			relationUpdates[relation] = { upsert: { create: fields, update: fields } };
		}

		return relationUpdates;
	}
}
