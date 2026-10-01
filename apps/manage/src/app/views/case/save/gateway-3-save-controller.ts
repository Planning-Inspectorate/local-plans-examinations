import type { Request } from 'express';
import { SaveController } from './save-controller.ts';
import { sortGateway3Submissions } from '#util/util.ts';
import type { Gateway3Input } from './save-inputs.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { NUM_GW3_SUBMISSIONS_QUESTIONS } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { ExaminationSaveController } from './examination-save-controller.ts';

export class Gateway3SaveController extends SaveController {
	protected async prepareData(req: Request, answers: Record<string, any>) {
		const caseDetails = await this.service.db.case.findUnique({
			select: {
				gateway3Info: {
					select: {
						submissions: true
					}
				}
			},
			where: { reference: this.caseReference }
		});
		if (!caseDetails) {
			throw Error(`Could not find details for case with reference '${this.caseReference}'`);
		}
		if (caseDetails.gateway3Info?.submissions == undefined || caseDetails.gateway3Info?.submissions.length == 0) {
			throw Error(`Could not find submission data for case with reference '${this.caseReference}'`);
		}
		const submissionDetails = sortGateway3Submissions(caseDetails.gateway3Info?.submissions);
		if (String(req.params.question).startsWith('gateway-3-completion-date')) {
			const submissionId = Number(String(req.params.question).replace('gateway-3-completion-date-', ''));
			submissionDetails[submissionId - 1].completionDate = answers[`completionDate-${submissionId}`];
			answers = {
				submissions: submissionDetails
			};
		}
		return this.trimStringValues(answers as Gateway3Input);
	}
	public async prepareAndSave(req: Request, answers: Record<string, any>, question?: string): Promise<boolean> {
		if (question === COMMON_CONSTS.EXAMINATION_WEBSITE_QUESTION) {
			return await new ExaminationSaveController(this.service, this.caseReference).prepareAndSave(
				req,
				{ examinationWebsite: answers.examinationWebsite },
				question
			);
		}
		return await super.prepareAndSave(req, answers, question);
	}

	protected async save(answers: Gateway3Input, question?: string) {
		const caseId = await this.resolveCaseId();
		if (
			question === COMMON_CONSTS.ASSESSOR_GATEWAY_3_QUESTION ||
			question === COMMON_CONSTS.GATEWAY_3_ASSESSOR_NAME_QUESTION
		) {
			answers.assessorAppointmentDate = new Date();
		}
		const createData: Record<string, any> = { ...answers };
		const updateData: Record<string, any> = { ...answers };
		if ('submissions' in answers) {
			const submissionDetails = answers.submissions;
			if (!submissionDetails) {
				throw Error('No submission entries found');
			}
			const submissionDetailsCleaned = Object.values(submissionDetails).map((e) => ({
				decision: e.decision,
				completionDate: e.completionDate
			}));
			if (submissionDetailsCleaned.length > NUM_GW3_SUBMISSIONS_QUESTIONS) {
				throw Error('Max number of submissions has been exceeded');
			}
			createData['submissions'] = {
				createMany: {
					data: submissionDetailsCleaned
				}
			};
			updateData['submissions'] = {
				deleteMany: {},
				createMany: {
					data: submissionDetailsCleaned
				}
			};
		}
		if (question?.startsWith(COMMON_CONSTS.GATEWAY_3_DOCUMENT_QUESTION)) {
			// For handling the save button
			return true;
		}
		if (answers) {
			await this.service.db.gateway3Info.upsert({
				where: { caseId },
				update: { ...updateData },
				create: {
					caseId,
					...createData
				}
			});
			return true;
		}
		return false;
	}
}
