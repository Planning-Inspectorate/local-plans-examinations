import type { Request } from 'express';
import { SaveController } from './save-controller.ts';
import type { CaseOverviewInput } from './save-inputs.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { Gateway2SaveController } from './gateway-2-save-controller.ts';
import { Gateway3SaveController } from './gateway-3-save-controller.ts';
import { ExaminationSaveController } from './examination-save-controller.ts';
import { questions } from '../questions.ts';
import type { Prisma } from '@pins/local-plans-database/src/client/client.ts';

export class OverviewSaveController extends SaveController {
	protected async prepareData(req: Request, answers: Record<string, any>) {
		return this.trimStringValues(answers as CaseOverviewInput);
	}

	public async prepareAndSave(req: Request, answers: Record<string, any>, question?: string): Promise<boolean> {
		if (question === COMMON_CONSTS.ASSESSOR_GATEWAY_2_QUESTION) {
			return await new Gateway2SaveController(this.service, this.caseReference).prepareAndSave(
				req,
				{ assessorName: answers.assessorName },
				question
			);
		}
		if (question === COMMON_CONSTS.ASSESSOR_GATEWAY_3_QUESTION) {
			return await new Gateway2SaveController(this.service, this.caseReference).prepareAndSave(
				req,
				{ assessorName: answers.gateway3AssessorName },
				question
			);
		}
		if (question === COMMON_CONSTS.PROGRAMME_OFFICER_QUESTION) {
			return await new Gateway3SaveController(this.service, this.caseReference).prepareAndSave(
				req,
				{
					programmeOfficerFirstName: answers.programmeOfficerFirstName,
					programmeOfficerLastName: answers.programmeOfficerLastName,
					programmeOfficerEmail: answers.programmeOfficerEmail
				},
				question
			);
		}

		if (question === COMMON_CONSTS.EXAMINING_INSPECTOR_1_QUESTION) {
			return await new ExaminationSaveController(this.service, this.caseReference).prepareAndSave(
				req,
				{ examiningInspector1: answers.examiningInspector1 },
				question
			);
		}
		if (question === COMMON_CONSTS.EXAMINING_INSPECTOR_2_QUESTION) {
			return await new ExaminationSaveController(this.service, this.caseReference).prepareAndSave(
				req,
				{ examiningInspector2: answers.examiningInspector2 },
				question
			);
		}
		if (question === COMMON_CONSTS.EXAMINING_INSPECTOR_3_QUESTION) {
			return await new ExaminationSaveController(this.service, this.caseReference).prepareAndSave(
				req,
				{ examiningInspector3: answers.examiningInspector3 },
				question
			);
		}
		if (question === COMMON_CONSTS.EXAMINATION_WEBSITE_QUESTION) {
			return await new ExaminationSaveController(this.service, this.caseReference).prepareAndSave(
				req,
				{ examinationWebsite: answers.examinationWebsite },
				question
			);
		}

		if (question === COMMON_CONSTS.QA_INSPECTOR_1_QUESTION) {
			return await new ExaminationSaveController(this.service, this.caseReference).prepareAndSave(
				req,
				{ qaInspector1: answers.qaInspector1 },
				question
			);
		}
		if (question === COMMON_CONSTS.QA_INSPECTOR_2_QUESTION) {
			return await new ExaminationSaveController(this.service, this.caseReference).prepareAndSave(
				req,
				{ qaInspector2: answers.qaInspector2 },
				question
			);
		}
		if (question === COMMON_CONSTS.QA_INSPECTOR_3_QUESTION) {
			return await new ExaminationSaveController(this.service, this.caseReference).prepareAndSave(
				req,
				{ qaInspector3: answers.qaInspector3 },
				question
			);
		}
		return await super.prepareAndSave(req, answers, question);
	}
	protected async save(answers: CaseOverviewInput, question?: string) {
		const lpaName = (questions.lpa.options || []).find((opt: any) => opt.value === answers.lpa)?.text || '';
		// Editing a contact's details (incl. changing that contact's LPA)
		if (this.section === 'contacts' && this.action === 'edit' && this.currentItemId) {
			await this.service.db.contact.update({
				where: { id: this.currentItemId },
				data: this.buildContactData(answers, lpaName)
			});
			return true;
		}

		// Changing the LPA associated with the *case*:
		// replace the old LPA (currentItemId) with the newly selected one (answers.lpa)
		if (question === COMMON_CONSTS.CHECK_LPAS_QUESTION && answers.lpa) {
			await this.service.db.case.update({
				where: { reference: this.caseReference },
				data: {
					lpas: {
						connectOrCreate: {
							where: {
								lpaCode: answers.lpa
							},
							create: {
								lpaCode: answers.lpa,
								lpaName: lpaName
							}
						},
						disconnect: this.currentItemId ? [{ lpaCode: this.currentItemId }] : undefined
					}
				}
			});
			return true;
		}

		if (question === COMMON_CONSTS.CHECK_CONTACT_DETAILS_QUESTION) {
			if (!this.currentItemId) return false;
			const contactData = this.buildContactData(answers, lpaName);
			await this.service.db.contact.upsert({
				where: { id: this.currentItemId },
				create: {
					...contactData,
					cases: { connect: { reference: this.caseReference } }
				},
				update: contactData
			});
			return true;
		}

		// Updating case (scalar) details + any newly added contact / LPA
		const { ...scalars } = answers;

		await this.service.db.case.update({
			where: { reference: this.caseReference },
			data: scalars
		});
		return true;
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
}
