import { SaveController } from './save-controller.ts';
import type { ExaminationInput } from './save-inputs.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';

export class ExaminationSaveController extends SaveController {
	protected async shouldSaveToSession() {
		return false;
	}
	protected async prepareData(answers: Record<string, any>) {
		return this.trimStringValues(answers as ExaminationInput);
	}

	private async pauseHistoryFor(planPauseStartDate: Date | null | undefined, caseId: string) {
		if (!planPauseStartDate) return {};

		const current = await this.service.db.examinationInfo.findUnique({
			where: { caseId },
			select: { planPauseStartDate: true }
		});

		if (current?.planPauseStartDate?.getTime() === planPauseStartDate.getTime()) return {};

		return { planPauseHistory: { create: { planPauseDate: planPauseStartDate } } };
	}

	protected async saveToDatabase(answers: ExaminationInput) {
		if (!answers) return false;

		const question = String(this.req.params.question);
		const caseId = await this.resolveCaseId();
		const inspectorQuestions = [
			COMMON_CONSTS.EXAMINING_INSPECTOR_1_QUESTION,
			COMMON_CONSTS.EXAMINING_INSPECTOR_2_QUESTION,
			COMMON_CONSTS.EXAMINING_INSPECTOR_3_QUESTION
		];
		if (question && inspectorQuestions.includes(question)) {
			answers.examiningInspectorAppointmentDate = new Date();
		}

		const pauseHistory = await this.pauseHistoryFor(answers.planPauseStartDate, caseId);

		await this.service.db.examinationInfo.upsert({
			where: { caseId },
			update: { ...answers, ...pauseHistory },
			create: { caseId, ...answers, ...pauseHistory }
		});
		return true;
	}
}
