import { SaveController } from './save-controller.ts';
import type { Gateway1Input } from './save-inputs.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';

export class Gateway1SaveController extends SaveController {
	protected async shouldSaveToSession() {
		return false;
	}
	protected async prepareData(answers: Record<string, any>) {
		return this.trimStringValues(answers as Gateway1Input);
	}

	protected async saveToDatabase(answers: Gateway1Input) {
		const question = String(this.req.params.question);
		const caseId = await this.resolveCaseId();
		if (question === COMMON_CONSTS.SIGNED_SLA_QUESTION) {
			answers.slaReceivedDate = new Date();
		}
		if (answers) {
			await this.service.db.gateway1Info.upsert({
				where: { caseId },
				update: { ...answers },
				create: { caseId, ...answers }
			});
			return true;
		}
		return false;
	}
}
