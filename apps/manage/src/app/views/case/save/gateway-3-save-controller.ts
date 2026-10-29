import { SaveController } from './save-controller.ts';
import { sortGateway3Submissions } from '#util/util.ts';
import type { Gateway3Input } from './save-inputs.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { NUM_GW3_SUBMISSIONS_QUESTIONS } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { ExaminationSaveController } from './examination-save-controller.ts';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';

type Gateway3SubmissionDatabase = Pick<PrismaClient, 'gateway3Info'>;

export async function saveGateway3Submissions(
	db: Gateway3SubmissionDatabase,
	caseId: string,
	submissionDetails: NonNullable<Gateway3Input['submissions']>
) {
	const submissionDetailsCleaned = Object.values(submissionDetails).map((entry) => ({
		decision: entry.decision,
		completionDate: entry.completionDate
	}));
	if (submissionDetailsCleaned.length > NUM_GW3_SUBMISSIONS_QUESTIONS) {
		throw Error('Max number of submissions has been exceeded');
	}
	await db.gateway3Info.upsert({
		where: { caseId },
		update: {
			submissions: {
				deleteMany: {},
				createMany: {
					data: submissionDetailsCleaned
				}
			}
		},
		create: {
			caseId,
			submissions: {
				createMany: {
					data: submissionDetailsCleaned
				}
			}
		}
	});
}

export class Gateway3SaveController extends SaveController {
	protected async shouldSaveToSession() {
		return false;
	}
	protected async prepareData(answers: Record<string, any>) {
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
		if (String(this.req.params.question).startsWith('gateway-3-completion-date')) {
			const submissionId = Number(String(this.req.params.question).replace('gateway-3-completion-date-', ''));
			submissionDetails[submissionId - 1].completionDate = answers[`completionDate-${submissionId}`];
			answers = {
				submissions: submissionDetails
			};
		}
		return this.trimStringValues(answers as Gateway3Input);
	}
	public async prepareAndSave(answers: Record<string, any>) {
		if (this.req.params.question === COMMON_CONSTS.EXAMINATION_WEBSITE_QUESTION) {
			return await new ExaminationSaveController(this.service, this.req, this.caseReference).prepareAndSave({
				examinationWebsite: answers.examinationWebsite
			});
		}
		return await super.prepareAndSave(answers);
	}

	protected async saveToDatabase(answers: Gateway3Input) {
		const caseId = await this.resolveCaseId();
		if (
			this.req.params.question === COMMON_CONSTS.ASSESSOR_GATEWAY_3_QUESTION ||
			this.req.params.question === COMMON_CONSTS.GATEWAY_3_ASSESSOR_NAME_QUESTION
		) {
			answers.assessorAppointmentDate = new Date();
		}
		if (String(this.req.params.question).startsWith(COMMON_CONSTS.GATEWAY_3_DOCUMENT_QUESTION)) {
			// For handling the save button
			return true;
		}
		const createData: Record<string, any> = { ...answers };
		const updateData: Record<string, any> = { ...answers };
		if ('submissions' in answers) {
			const submissionDetails = answers.submissions;
			if (!submissionDetails) {
				throw Error('No submission entries found');
			}
			await saveGateway3Submissions(this.service.db, caseId, submissionDetails);
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
