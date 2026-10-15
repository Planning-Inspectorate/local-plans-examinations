import { SaveController } from './save-controller.ts';
import type { ExaminationInput } from './save-inputs.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { examinationPauseBaseUrls } from '../questions.ts';
import { sortByCreatedDate } from '#util/util.ts';
import { parseDate } from '../../../util/date.ts';

export class ExaminationSaveController extends SaveController {
	private isExaminationPauseQuestion() {
		const question = String(this.req.params.question);
		const matchedQuestion = examinationPauseBaseUrls.find((prefix) => question.startsWith(prefix));
		return !!matchedQuestion;
	}
	protected async shouldSaveToSession() {
		return this.isExaminationPauseQuestion();
	}

	protected async prepareData(answers: Record<string, any>) {
		const question = String(this.req.params.question);
		const matchedExaminationPauseQuestion = examinationPauseBaseUrls.find((prefix) => question.startsWith(prefix));
		if (matchedExaminationPauseQuestion) {
			const caseDetails = await this.service.db.case.findUnique({
				select: {
					id: true,
					examinationInfo: {
						select: {
							pauses: true
						}
					}
				},
				where: { reference: this.caseReference }
			});
			if (!caseDetails) {
				throw Error(`Could not find details for case with reference '${this.caseReference}'`);
			}
			if (caseDetails.examinationInfo?.pauses == undefined) {
				throw Error(`Could not find examination pause data for case with reference '${this.caseReference}'`);
			}
			const pauseId = parseInt(String(this.req.url.split('-').at(-1)));
			const pauseDetails = sortByCreatedDate(caseDetails?.examinationInfo?.pauses);
			if (pauseId > pauseDetails.length) {
				pauseDetails.push({ startDate: answers[`examinationPauseStartDate-${pauseId}`], createdDate: new Date() });
			}
			// Enrich the current pause item with the answers
			if (this.req.session && this.req.session.answers && this.req.session.answers.pauses) {
				const filteredSessionAnswerPauses = sortByCreatedDate(this.req.session.answers.pauses);
				pauseDetails[pauseId - 1] = {
					...pauseDetails[pauseId - 1],
					...filteredSessionAnswerPauses[pauseId - 1]
				};
			}
			return {
				pauses: pauseDetails
			};
		}
		return this.trimStringValues(answers as ExaminationInput);
	}
	protected saveToSession(answers: ExaminationInput) {
		const pauseIdString = String(this.req.params.question).split('-').at(-1);
		if (!pauseIdString) {
			throw Error('Could not extract the pause id from the question');
		}
		const pauseId = parseInt(pauseIdString);
		if (!this.req.session) {
			throw Error('request has no session data');
		}
		if (this.req.session.answers) {
			const sessionAnswers = this.req.session.answers as ExaminationInput;
			const pauseAnswers = sessionAnswers.pauses;
			if (pauseAnswers && answers.pauses) {
				const sessionAnswers = pauseAnswers[pauseId - 1];
				const newAnswers = answers.pauses[pauseId - 1];
				answers.pauses[pauseId - 1] = { ...sessionAnswers, ...newAnswers };
			}
		}
		this.req.session.answers = answers;
		return true;
	}

	protected async saveToDatabase(answers: ExaminationInput) {
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
		const createData: Record<string, any> = { ...answers };
		const updateData: Record<string, any> = { ...answers };
		if ('pauses' in answers) {
			const pauses = sortByCreatedDate(answers.pauses as { createdDate: Date; [key: string]: any }[]);
			if (!pauses) {
				throw Error('No examination pause entries found');
			}
			const pausesCleaned = Object.values(pauses).map((e) => ({
				createdDate: e.createdDate,
				startDate: e.startDate && typeof e.startDate == 'string' ? parseDate(e.startDate) : e.startDate,
				details: e.details,
				endDate: e.endDate && typeof e.endDate == 'string' ? parseDate(e.endDate) : e.endDate
			}));
			if (pausesCleaned.length > COMMON_CONSTS.NUM_EXAM_PAUSE_QUESTIONS) {
				throw Error('Max number of examination pauses has been exceeded');
			}
			createData['pauses'] = {
				createMany: {
					data: pausesCleaned
				}
			};
			updateData['pauses'] = {
				deleteMany: {}, // Delete any referenced pauses that have not been sunmitted
				createMany: {
					data: pausesCleaned
				}
			};
		}
		if (answers) {
			await this.service.db.examinationInfo.upsert({
				where: { caseId },
				update: { ...updateData },
				create: { caseId, ...createData }
			});
			return true;
		}
		return false;
	}
}
