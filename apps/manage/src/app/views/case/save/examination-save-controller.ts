import { SaveController } from './save-controller.ts';
import { examinationHearingBaseUrls } from '../questions.ts';
import { sortExaminationHearings } from '#util/util.ts';
import { parseDate } from '../../../util/date.ts';
import type { ExaminationInput } from './save-inputs.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { NUM_EXAMINATION_HEARING_QUESTIONS } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

export class ExaminationSaveController extends SaveController {
	private caseId: string | undefined;
	private isExaminationHearingQuestion() {
		const question = String(this.req.params.question);
		const matchedQuestion = examinationHearingBaseUrls.find((prefix) => question.startsWith(prefix));
		return !!matchedQuestion;
	}
	protected async shouldSaveToSession() {
		return false;
	}
	protected async prepareData(answers: Record<string, any>) {
		const caseDetails = await this.service.db.case.findUnique({
			select: {
				id: true,
				examinationInfo: {
					select: {
						hearings: true
					}
				}
			},
			where: { reference: this.caseReference }
		});
		if (!caseDetails) {
			throw Error(`Could not find details for case with reference '${this.caseReference}'`);
		}
		if (!this.caseId) {
			this.caseId = caseDetails.id;
		}
		if (caseDetails.examinationInfo?.hearings == undefined) {
			throw Error(`Could not find hearing data for case with reference '${this.caseReference}'`);
		}
		const question = this.req.params.question ? String(this.req.params.question) : '';
		const matchedQuestion = examinationHearingBaseUrls.find((prefix) => question.startsWith(prefix));
		const submittingCheckYourAnswers = String(this.req.url).includes('check-your-answers');
		if (matchedQuestion || submittingCheckYourAnswers) {
			const hearingIdFromUrlFromQuestion = parseInt(question.replace(`${matchedQuestion}-`, ''));
			const hearingIdFromUrl = parseInt(String(this.req.url.split('-').at(-1)));
			const hearingId = isNaN(hearingIdFromUrlFromQuestion) ? hearingIdFromUrl : hearingIdFromUrlFromQuestion;
			if (!hearingId) {
				throw Error('Could not extract the hearing id');
			}
			const hearingDetails = sortExaminationHearings(caseDetails.examinationInfo?.hearings);
			if (hearingId > hearingDetails.length) {
				hearingDetails.push({ hearingDate: null, createdDate: new Date() });
			}
			// Enrich the current workshop with the answers
			if (this.req.session && this.req.session.answers && this.req.session.answers.hearings) {
				const filteredSessionAnswerHearings = sortExaminationHearings(this.req.session.answers.hearings);
				hearingDetails[hearingId - 1] = {
					...hearingDetails[hearingId - 1],
					...filteredSessionAnswerHearings[hearingId - 1]
				};
			}
			const currentHearing = hearingDetails[hearingId - 1];
			const hearingFieldsToAnswerMap = {
				hearingDate: `hearingDate-${hearingId}`,
				hearingTime: `hearingTime-${hearingId}`,
				hearingExpectedDaysKnown: `hearingExpectedDaysKnown-${hearingId}`,
				hearingExpectedDays: `hearingExpectedDaysKnown-${hearingId}_hearingExpectedDays`, // Radio button with nested field
				hearingLocationType: `hearingLocationType-${hearingId}`,
				hearingRemoteMeetingLinkKnown: `hearingRemoteMeetingLinkKnown-${hearingId}`,
				hearingRemoteMeetingLink: `hearingRemoteMeetingLink-${hearingId}`,
				hearingLocationKnown: `hearingLocationKnown-${hearingId}`,
				hearingVenueName: `hearingVenueName-${hearingId}`,
				hearingAddressLine: `hearingAddressLine-${hearingId}`,
				hearingAddressLine2: `hearingAddressLine2-${hearingId}`,
				hearingTownOrCity: `hearingTownOrCity-${hearingId}`,
				hearingPostcode: `hearingPostcode-${hearingId}`
			};
			Object.entries(hearingFieldsToAnswerMap).forEach(([hearingField, answerField]) => {
				const questionAnswer = answers[answerField];
				if (questionAnswer) {
					if (hearingField == 'hearingDate') {
						currentHearing[hearingField] = parseDate(questionAnswer);
					} else {
						currentHearing[hearingField] = questionAnswer;
					}
				}
			});
			return {
				hearings: hearingDetails
			};
		}
		return this.trimStringValues(answers as ExaminationInput);
	}
	protected saveToSession(answers: ExaminationInput) {
		const hearingIdString = String(this.req.params.question).split('-').at(-1);
		if (!hearingIdString) {
			throw Error('Could not extract the workshop id from the question');
		}
		const hearingId = parseInt(hearingIdString);
		if (!this.req.session) {
			throw Error('request has no session data');
		}
		if (this.req.session.answers) {
			const sessionAnswers = this.req.session.answers as ExaminationInput;
			const hearingAnswers = sessionAnswers.hearings;
			if (hearingAnswers && answers.hearings) {
				const sessionAnswers = hearingAnswers[hearingId - 1];
				const newAnswers = answers.hearings[hearingId - 1];
				answers.hearings[hearingId - 1] = { ...sessionAnswers, ...newAnswers };
			}
		}
		this.req.session.answers = answers;
		return true;
	}
	protected async saveToDatabase(answers: ExaminationInput) {
		const question = String(this.req.params.question);
		if (!this.caseId) {
			throw Error(`save called but caseId was not already fetched - please check that prepareData was called first`);
		}
		//const caseId = await this.resolveCaseId();
		const inspectorQuestions = [
			COMMON_CONSTS.EXAMINING_INSPECTOR_1_QUESTION,
			COMMON_CONSTS.EXAMINING_INSPECTOR_2_QUESTION,
			COMMON_CONSTS.EXAMINING_INSPECTOR_3_QUESTION
		];
		if (question && inspectorQuestions.includes(question)) {
			answers.examiningInspectorAppointmentDate = new Date();
		}
		if (answers.hearingDate) {
			answers.hearingDate = parseDate(answers.hearingDate as any);
		}
		const createData: Record<string, any> = { ...answers };
		const updateData: Record<string, any> = { ...answers };
		if ('hearings' in answers) {
			const hearings = sortExaminationHearings(answers.hearings as { createdDate: Date; [key: string]: any }[]);
			if (!hearings) {
				throw Error('No hearing entries found');
			}
			const hearingsCleaned = Object.values(hearings).map((e) => ({
				createdDate: e.createdDate,
				hearingDate: e.hearingDate,
				hearingTime: e.hearingTime,
				hearingExpectedDaysKnown: e.hearingExpectedDaysKnown,
				hearingExpectedDays: e.hearingExpectedDays,
				hearingLocationType: e.hearingLocationType,
				hearingRemoteMeetingLinkKnown: e.hearingRemoteMeetingLinkKnown,
				hearingRemoteMeetingLink: e.hearingRemoteMeetingLink,
				hearingLocationKnown: e.hearingLocationKnown,
				hearingVenueName: e.hearingVenueName,
				hearingAddressLine: e.hearingAddressLine,
				hearingAddressLine2: e.hearingAddressLine2,
				hearingTownOrCity: e.hearingTownOrCity,
				hearingPostcode: e.hearingPostcode
			}));
			if (hearingsCleaned.length > NUM_EXAMINATION_HEARING_QUESTIONS) {
				throw Error('Max number of hearings has been exceeded');
			}
			createData['hearings'] = {
				createMany: {
					data: hearingsCleaned
				}
			};
			updateData['hearings'] = {
				deleteMany: {}, // Delete any referenced hearings that have not been sunmitted
				createMany: {
					data: hearingsCleaned
				}
			};
		}

		if (answers) {
			await this.service.db.examinationInfo.upsert({
				where: { caseId: this.caseId },
				update: { ...updateData },
				create: { caseId: this.caseId, ...createData }
			});
			return true;
		}
		return false;
	}
}
