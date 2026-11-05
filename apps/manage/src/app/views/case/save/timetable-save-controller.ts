import { GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/case.ts';
import { SaveController } from './save-controller.ts';
import type { TimetableInput } from './save-inputs.ts';
import { Gateway1SaveController } from './gateway-1-save-controller.ts';
import { Gateway2SaveController } from './gateway-2-save-controller.ts';
import { Gateway3SaveController } from './gateway-3-save-controller.ts';
import { ExaminationSaveController } from './examination-save-controller.ts';

const timetableGateway1Questions = new Set([
	'notice-of-intention-publish-date',
	'expected-gateway-1-date',
	'completed-gateway-1-date',
	'sla-sent-date',
	'sla-received-date'
]);

const timetableGateway2Questions = new Set([
	'gateway-2-expected-date',
	'gateway-2-actual-date',
	'gateway-2-report-issued-date',
	'gateway-2-report-published-date'
]);

const timetableGateway3Questions = new Set([
	'gateway-3-expected-date',
	'gateway-3-actual-date',
	'timetable-gateway-3-completion-date'
]);

const timetableExaminationQuestions = new Set([
	'examination-expected-submission-date',
	'examination-actual-submission-date',
	'letter-sent-to-mhclg-date',
	'letter-issue-date',
	'qa-date',
	'report-sent-to-panel-date',
	'panel-response-to-inspector-date',
	'fact-check-date-received-from-inspector',
	'fact-check-due-date',
	'fact-check-actual-date',
	'fact-check-received-back-from-lpa-date',
	'final-report-issue-date',
	'withdrawn-date',
	'is-sound',
	'sound-unsound-date',
	'adoption-date',
	'approved-for-cil-date'
]);

const timetablePauseQuestionPattern = /^examination-pause-(start|end)-date-(\d+)$/;

export class TimetableSaveController extends SaveController {
	protected async shouldSaveToSession() {
		return false;
	}

	protected async prepareData(answers: Record<string, any>) {
		return this.trimStringValues(answers as TimetableInput);
	}

	protected async saveToDatabase(answers: TimetableInput) {
		const question = String(this.req.params.question);

		if (timetableGateway1Questions.has(question)) {
			const controller = new Gateway1SaveController(this.service, this.req, this.caseReference);
			await controller.prepareAndSave(answers);
		}
		if (timetableGateway2Questions.has(question)) {
			const controller = new Gateway2SaveController(this.service, this.req, this.caseReference);
			await controller.prepareAndSave(answers);
		}
		if (question === 'timetable-gateway-3-completion-date') {
			const caseId = await this.resolveCaseId();
			await this.service.db.gateway3Submission.updateMany({
				where: { gateway3Info: { caseId }, decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION },
				data: { completionDate: (answers as Record<string, any>).gateway3CompletionDate }
			});
			return true;
		}
		if (timetableGateway3Questions.has(question)) {
			const controller = new Gateway3SaveController(this.service, this.req, this.caseReference);
			const { gateway3ExpectedDate, gateway3ActualDate, ...rest } = answers as Record<string, any>;
			const gateway3Answers = { ...rest };
			if ('gateway3ExpectedDate' in answers) gateway3Answers.expectedDate = gateway3ExpectedDate;
			if ('gateway3ActualDate' in answers) gateway3Answers.actualDate = gateway3ActualDate;
			await controller.prepareAndSave(gateway3Answers);
		}
		const pauseMatch = timetablePauseQuestionPattern.exec(question);

		if (timetableExaminationQuestions.has(question) || pauseMatch) {
			const controller = new ExaminationSaveController(this.service, this.req, this.caseReference);
			await controller.prepareAndSave(answers);
		}

		return false;
	}
}
