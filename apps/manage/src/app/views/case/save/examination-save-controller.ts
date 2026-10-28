import { SaveController } from './save-controller.ts';
import { examinationHearingBaseUrls } from '../questions.ts';
import { sortByDateColumn } from '#util/util.ts';
import { parseDate } from '../../../util/date.ts';
import type { ExaminationInput } from './save-inputs.ts';
import { examinationPauseBaseUrls } from '../questions.ts';
import { COMMON_CONSTS, NUM_EXAMINATION_HEARING_QUESTIONS } from '../../../classes/common-consts.ts';
import { formatDateToString } from '../../../util/date.ts';
import type { PlanPauseHistory } from '@pins/local-plans-database/src/client/client.ts';
import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

export class ExaminationSaveController extends SaveController {
	private caseId: string | undefined;
	private examinationStatus: string | undefined;
	private cachedCaseDetails: {
		id: string;
		examinationInfo: {
			planPauseHistory: {
				createdAt: Date;
				planPauseDate: Date;
				planPauseStartDetails: string | null;
				planPauseEndDate: Date | null;
				planPauseEndDetails: string | null;
				examinationInfoId: string;
			}[];
		} | null;
	} | null = null;

	private async getCaseData() {
		if (!this.cachedCaseDetails) {
			this.cachedCaseDetails = await this.service.db.case.findUnique({
				select: {
					id: true,
					examinationInfo: {
						select: {
							planPauseHistory: true
						}
					}
				},
				where: { reference: this.caseReference }
			});
		}
		return this.cachedCaseDetails;
	}

	private isExaminationHearingQuestion() {
		const question = String(this.req.params.question);
		const matchedQuestion = examinationHearingBaseUrls.find((prefix) => question.startsWith(prefix));
		return !!matchedQuestion;
	}

	protected async shouldSaveToSession() {
		const shouldSaveToSession = this.isExaminationHearingQuestion();
		if (shouldSaveToSession) {
			return true;
		}
		const caseDetails = await this.getCaseData();
		if (!caseDetails) {
			throw Error(`Could not find details for case with reference '${this.caseReference}'`);
		}
		if (caseDetails.examinationInfo?.planPauseHistory == undefined) {
			return false;
		}
		const question = String(this.req.params.question);
		const pauseId = parseInt(String(question.split('-').at(-1)));
		if (isNaN(pauseId)) {
			return false;
		}
		const pauses = sortByDateColumn(caseDetails?.examinationInfo?.planPauseHistory, 'createdAt');
		const currentPause = pauses.at(pauseId - 1) as PlanPauseHistory | undefined;
		if (question.startsWith('examination-pause-start-date')) {
			// Save to session if there is no pause data for the first question
			return !currentPause;
		}
		if (question.startsWith('examination-pause-end-date')) {
			// Save to session if there is no end date already saved
			return !(currentPause && currentPause.planPauseEndDate);
		}
		return false;
	}

	/**
	 * Return true if all pauses except for the last pause have an planPauseEndDate supplied
	 * @param sortedPauses The pauses to check for. The pauses MUST have been sorted beforehand
	 * @returns True if the pause list is valid, false otherwise
	 */
	protected validatePauses(sortedPauses: PlanPauseHistory[]) {
		let previousPause: PlanPauseHistory | undefined;
		for (const pause of sortedPauses) {
			if (previousPause) {
				if (!previousPause.planPauseEndDate) {
					return false;
				}
			}
			previousPause = pause;
		}
		return true;
	}

	protected async prepareData(answers: Record<string, any>) {
		const caseDetails = await this.service.db.case.findUnique({
			select: {
				id: true,
				examinationInfo: {
					select: {
						hearings: true,
						status: true
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
		this.examinationStatus = caseDetails.examinationInfo?.status;
		if (caseDetails.examinationInfo?.hearings == undefined) {
			throw Error(`Could not find hearing data for case with reference '${this.caseReference}'`);
		}
		const question = this.req.params.question ? String(this.req.params.question) : '';
		const matchedHearingQuestion = examinationHearingBaseUrls.find((prefix) => question.startsWith(prefix));
		const submittingCheckYourAnswers = String(this.req.url).includes('check-your-answers');
		if (matchedHearingQuestion || submittingCheckYourAnswers) {
			const hearingIdFromUrlFromQuestion = parseInt(question.replace(`${matchedHearingQuestion}-`, ''));
			const hearingIdFromUrl = parseInt(String(this.req.url.split('-').at(-1)));
			const hearingId = isNaN(hearingIdFromUrlFromQuestion) ? hearingIdFromUrl : hearingIdFromUrlFromQuestion;
			if (!hearingId) {
				throw Error('Could not extract the hearing id');
			}
			const hearingDetails = sortByDateColumn(caseDetails.examinationInfo?.hearings, 'createdDate');
			if (hearingId > hearingDetails.length) {
				hearingDetails.push({ hearingDate: null, createdDate: new Date() });
			}
			// Enrich the current hearing with the answers
			if (this.req.session && this.req.session.answers && this.req.session.answers.hearings) {
				const filteredSessionAnswerHearings = sortByDateColumn(this.req.session.answers.hearings, 'createdDate');
				hearingDetails[hearingId - 1] = {
					...hearingDetails[hearingId - 1],
					...filteredSessionAnswerHearings[hearingId - 1]
				};
			}
			const currentHearing = hearingDetails[hearingId - 1];
			const questionFieldsMap = {
				[`examination-hearing-date-and-time-${hearingId}`]: {
					hearingDate: `hearingDate-${hearingId}`,
					hearingTime: `hearingTime-${hearingId}`
				},
				[`examination-hearing-expected-days-${hearingId}`]: {
					hearingExpectedDaysKnown: `hearingExpectedDaysKnown-${hearingId}`,
					hearingExpectedDays: `hearingExpectedDaysKnown-${hearingId}_hearingExpectedDays`
				},
				[`examination-hearing-location-type-${hearingId}`]: {
					hearingLocationType: `hearingLocationType-${hearingId}`
				},
				[`examination-hearing-location-known-${hearingId}`]: {
					hearingLocationKnown: `hearingLocationKnown-${hearingId}`
				},
				[`examination-hearing-venue-address-${hearingId}`]: {
					hearingVenueName: `hearingVenueName-${hearingId}`,
					hearingAddressLine: `hearingAddressLine-${hearingId}`,
					hearingAddressLine2: `hearingAddressLine2-${hearingId}`,
					hearingTownOrCity: `hearingTownOrCity-${hearingId}`,
					hearingPostcode: `hearingPostcode-${hearingId}`
				},
				[`examination-remote-meeting-link-known-${hearingId}`]: {
					hearingRemoteMeetingLinkKnown: `hearingRemoteMeetingLinkKnown-${hearingId}`
				},
				[`examination-remote-meeting-link-${hearingId}`]: {
					hearingRemoteMeetingLink: `hearingRemoteMeetingLink-${hearingId}`
				}
			};
			const hearingFieldsToAnswerMap: Record<string, string> = Object.assign({}, ...Object.values(questionFieldsMap));
			Object.entries(hearingFieldsToAnswerMap).forEach(([hearingField, answerField]) => {
				const questionAnswer = answers[answerField];
				const matchedSpecificQuestion = Boolean(questionFieldsMap[question]);
				const fieldIsForcurrentQuestion = matchedSpecificQuestion
					? Object.values(questionFieldsMap[question]).includes(answerField)
					: false;
				if (questionAnswer ?? (matchedSpecificQuestion && fieldIsForcurrentQuestion)) {
					currentHearing[hearingField] = questionAnswer;
				}
			});
			if (currentHearing.hearingDetails) {
				if (typeof currentHearing.hearingDetails == 'object') {
					currentHearing.hearingDetails = formatDateToString(currentHearing.hearingDetails);
				}
			}

			return {
				hearings: hearingDetails
			};
		}
		const matchedExaminationPauseQuestion = examinationPauseBaseUrls.find((prefix) => question.startsWith(prefix));
		if (matchedExaminationPauseQuestion) {
			const caseDetails = await this.getCaseData();
			if (!caseDetails) {
				throw Error(`Could not find details for case with reference '${this.caseReference}'`);
			}
			if (caseDetails.examinationInfo?.planPauseHistory == undefined) {
				throw Error(`Could not find examination pause data for case with reference '${this.caseReference}'`);
			}
			const pauseId = parseInt(String(this.req.url.split('-').at(-1)));
			const pauseDetails = sortByDateColumn(caseDetails?.examinationInfo?.planPauseHistory, 'createdAt');
			if (pauseId > pauseDetails.length) {
				pauseDetails.push({ planPauseDate: answers[`planPauseDate-${pauseId}`], createdAt: new Date() });
			}
			const questionFieldMap: Record<string, string> = {
				'examination-pause-start-date': 'planPauseDate',
				'examination-pause-details': 'planPauseStartDetails',
				'examination-pause-end-date': 'planPauseEndDate',
				'examination-pause-restart-details': 'planPauseEndDetails'
			};
			const questionWithoutPauseId = question.replace(`-${pauseId}`, '');

			// Enrich the current pause item with the answers
			if (this.req.session && this.req.session.answers && this.req.session.answers.planPauseHistory) {
				const filteredSessionAnswerPauses = sortByDateColumn(this.req.session.answers.planPauseHistory, 'createdAt');
				pauseDetails[pauseId - 1] = {
					...pauseDetails[pauseId - 1],
					...filteredSessionAnswerPauses[pauseId - 1]
				};
			}
			const currentQuestionField = questionFieldMap[questionWithoutPauseId];
			const answersForCurrentQuestion = Object.fromEntries(
				Object.entries(answers)
					.filter(([key]) => key == `${currentQuestionField}-${pauseId}`)
					.map(([key, value]) => [key.replace(`-${pauseId}`, ''), value])
			);
			pauseDetails[pauseId - 1] = {
				...pauseDetails[pauseId - 1],
				...answersForCurrentQuestion
			};
			const pausesValid = this.validatePauses(pauseDetails as PlanPauseHistory[]);
			if (!pausesValid) {
				throw Error('Preprocessing check detected that not all contiguious pauses had an planPauseEndDate specified');
			}
			return {
				planPauseHistory: pauseDetails
			};
		}
		return this.trimStringValues(answers as ExaminationInput);
	}
	protected saveToSession(answers: ExaminationInput) {
		const question = String(this.req.params.question);
		if (examinationHearingBaseUrls.find((prefix) => question.startsWith(prefix))) {
			const hearingIdString = String(this.req.params.question).split('-').at(-1);
			if (!hearingIdString) {
				throw Error('Could not extract the hearing id from the question');
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
			const currentHearing = answers.hearings?.[hearingId - 1];
			if (currentHearing?.hearingExpectedDaysKnown == 'no') {
				delete (currentHearing as any).hearingExpectedDays;
			}
			if (currentHearing?.hearingLocationType == 'remote') {
				currentHearing.hearingLocationKnown = null;
				currentHearing.hearingVenueName = null;
				currentHearing.hearingAddressLine = null;
				currentHearing.hearingAddressLine2 = null;
				currentHearing.hearingTownOrCity = null;
				currentHearing.hearingPostcode = null;
			}
			if (currentHearing?.hearingLocationKnown == 'no') {
				delete (currentHearing as any).hearingVenueName;
				delete (currentHearing as any).hearingAddressLine;
				delete (currentHearing as any).hearingAddressLine2;
				delete (currentHearing as any).hearingTownOrCity;
				delete (currentHearing as any).hearingPostcode;
			}
			if (currentHearing?.hearingLocationType == 'in-person') {
				delete (currentHearing as any).hearingRemoteMeetingLinkKnown;
				delete (currentHearing as any).hearingRemoteMeetingLink;
			}
			if (currentHearing?.hearingRemoteMeetingLinkKnown == 'no') {
				delete (currentHearing as any).hearingRemoteMeetingLink;
			}
			this.req.session.answers = answers;
			return true;
		} else if (examinationPauseBaseUrls.find((prefix) => question.startsWith(prefix))) {
			const pauseIdString = String(String(this.req.params.question).split('-').at(-1));
			const pauseId = parseInt(pauseIdString);
			if (isNaN(pauseId)) {
				throw Error('Could not extract the pause id from the question');
			}
			if (!this.req.session) {
				throw Error('request has no session data');
			}
			if (this.req.session.answers) {
				const sessionAnswers = this.req.session.answers as ExaminationInput;
				const pauseAnswers = sessionAnswers.planPauseHistory;
				if (pauseAnswers && answers.planPauseHistory) {
					const sessionAnswers = pauseAnswers[pauseId - 1];
					const newAnswers = answers.planPauseHistory[pauseId - 1];
					this.req.session.answers.planPauseHistory[pauseId - 1] = { ...sessionAnswers, ...newAnswers };
				}
			} else {
				this.req.session.answers = answers;
			}
			return true;
		}
		return false;
	}

	protected async saveToDatabase(answers: ExaminationInput) {
		if (!answers) return false;

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
		let statusUpdate: { status?: string } =
			question && inspectorQuestions.includes(question) && this.examinationStatus === EXAMINATION_STATUS_ID.SUBMITTED
				? { status: EXAMINATION_STATUS_ID.IN_EXAMINATION }
				: {};
		if (answers.adoptionDate) {
			statusUpdate = { status: EXAMINATION_STATUS_ID.PLAN_ADOPTED };
		}
		const createData: Record<string, any> = { ...answers, ...statusUpdate };
		const updateData: Record<string, any> = { ...answers, ...statusUpdate };
		if ('planPauseHistory' in answers) {
			const pauses = sortByDateColumn(
				answers.planPauseHistory as { createdAt: Date; [key: string]: any }[],
				'createdAt'
			);
			if (!pauses) {
				throw Error('No examination pause entries found');
			}
			const pausesCleaned = Object.values(pauses as PlanPauseHistory[]).map((e) => ({
				createdAt: e.createdAt,
				planPauseDate:
					e.planPauseDate && typeof e.planPauseDate == 'string' ? parseDate(e.planPauseDate) : e.planPauseDate,
				planPauseStartDetails: e.planPauseStartDetails,
				planPauseEndDate:
					e.planPauseEndDate && typeof e.planPauseEndDate == 'string'
						? parseDate(e.planPauseEndDate)
						: e.planPauseEndDate,
				planPauseEndDetails: e.planPauseEndDetails
			}));
			if (pausesCleaned.length > COMMON_CONSTS.NUM_EXAM_PAUSE_QUESTIONS) {
				throw Error('Max number of examination pauses has been exceeded');
			}
			createData['planPauseHistory'] = {
				createMany: {
					data: pausesCleaned
				}
			};
			updateData['planPauseHistory'] = {
				deleteMany: {}, // Delete any referenced pauses that have not been sunmitted
				createMany: {
					data: pausesCleaned
				}
			};
		}
		if ('hearings' in answers) {
			const hearings = sortByDateColumn(answers.hearings as { [key: string]: any }[], 'createdDate');
			if (!hearings) {
				throw Error('No hearing entries found');
			}
			const hearingsCleaned = Object.values(hearings).map((e) => ({
				id: e.id,
				createdDate: e.createdDate,
				hearingDate: e.hearingDate && typeof e.hearingDate == 'string' ? parseDate(e.hearingDate) : e.hearingDate,
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
