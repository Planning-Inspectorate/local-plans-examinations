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
	'gateway-2-workshop-date',
	'gateway-2-report-issued-date',
	'gateway-2-report-published-date'
]);

const timetableGateway3Questions = new Set([
	'gateway-3-expected-date',
	'gateway-3-actual-date',
	'gateway-3-completion-date'
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
	'plan-pause-start-date',
	'plan-pause-end-date',
	'withdrawn-date',
	'is-sound',
	'sound-unsound-date',
	'adoption-date',
	'approved-for-cil-date'
]);

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
            const controller = await new Gateway1SaveController(this.service, this.req, this.caseReference)
            controller.prepareAndSave(answers);
        }
        if (timetableGateway2Questions.has(question)) {
            const controller = await new Gateway2SaveController(this.service, this.req, this.caseReference)
            controller.prepareAndSave(answers);
        }
        if (timetableGateway3Questions.has(question)) {
            const controller = await new Gateway3SaveController(this.service, this.req, this.caseReference)
            controller.prepareAndSave(answers);
        }
        if (timetableExaminationQuestions.has(question)) {
            const controller = await new ExaminationSaveController(this.service, this.req, this.caseReference)
            controller.prepareAndSave(answers);
        }

        return false;
    }
}