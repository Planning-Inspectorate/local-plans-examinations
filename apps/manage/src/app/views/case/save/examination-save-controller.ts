import { SaveController } from './save-controller.ts';
import { examinationHearingBaseUrls } from '../questions.ts';
import { sortByCreatedDate } from '#util/util.ts';
import { parseDate } from '../../../util/date.ts';
import type { ExaminationInput } from './save-inputs.ts';
import { COMMON_CONSTS, NUM_EXAMINATION_HEARING_QUESTIONS } from '../../../classes/common-consts.ts';
import { formatDateToString } from '../../../util/date.ts';

type Hearing = NonNullable<ExaminationInput['hearings']>[number];

const NO_VENUE = {
	hearingVenueName: null,
	hearingAddressLine: null,
	hearingAddressLine2: null,
	hearingTownOrCity: null,
	hearingPostcode: null
} satisfies Partial<Hearing>;

const NO_REMOTE_LINK = {
	hearingRemoteMeetingLinkKnown: null,
	hearingRemoteMeetingLink: null
} satisfies Partial<Hearing>;

function clearOutdatedAnswers(hearing: Hearing): Hearing {
	return {
		...hearing,
		...(hearing.hearingExpectedDaysKnown === 'no' && { hearingExpectedDays: null }),
		...(hearing.hearingLocationType === 'remote' && { hearingLocationKnown: null, ...NO_VENUE }),
		...(hearing.hearingLocationKnown === 'no' && NO_VENUE),
		...(hearing.hearingLocationType === 'in-person' && NO_REMOTE_LINK),
		...(hearing.hearingRemoteMeetingLinkKnown === 'no' && { hearingRemoteMeetingLink: null })
	};
}

export class ExaminationSaveController extends SaveController {
	private caseId: string | undefined;
	private isExaminationHearingQuestion() {
		const question = String(this.req.params.question);
		const matchedQuestion = examinationHearingBaseUrls.find((prefix) => question.startsWith(prefix));
		return !!matchedQuestion;
	}
	protected async shouldSaveToSession() {
		const question = String(this.req.params.question);
		if (question.startsWith('examination-hearing-end-date-') || question.startsWith('examination-hearing-duration-')) {
			return false;
		}
		return this.isExaminationHearingQuestion();
	}
	/**
	 * Delete the hearing at the given index
	 * @param hearingId The hearing id to delete (from the URL, not the index in the hearing list)
	 * @returns The result of the save operation
	 */
	public async deleteHearing(hearingId: number) {
		const hearingIndex = hearingId - 1;
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
		const hearingDetails = sortByCreatedDate(caseDetails.examinationInfo?.hearings);
		if (hearingDetails.length == 0) {
			throw Error(`There are no hearings to delete for the case with reference '${this.caseReference}'`);
		}
		if (hearingIndex < 0) {
			throw Error(`Given hearing id '${hearingIndex}' must be greater than '0'`);
		}
		if (hearingIndex >= hearingDetails.length) {
			throw Error(
				`Given hearing id '${hearingIndex}' is greater than the number of hearings '${hearingDetails.length}'`
			);
		}
		hearingDetails.splice(hearingIndex, 1);
		return this.save({
			hearings: hearingDetails
		});
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
			const hearingDetails = sortByCreatedDate(caseDetails.examinationInfo?.hearings);
			if (hearingId > hearingDetails.length) {
				hearingDetails.push({ hearingDate: null, createdDate: new Date() });
			}
			// Enrich the current hearing with the answers
			if (this.req.session && this.req.session.answers && this.req.session.answers.hearings) {
				const filteredSessionAnswerHearings = sortByCreatedDate(this.req.session.answers.hearings);
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
				},
				[`examination-hearing-duration-${hearingId}`]: {
					hearingDuration: `hearingDuration-${hearingId}`
				},
				[`examination-hearing-end-date-${hearingId}`]: {
					hearingEndDate: `hearingEndDate-${hearingId}`
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
		return this.trimStringValues(answers as ExaminationInput);
	}
	private getHearingIndex(): number {
		const hearingIdString = String(this.req.params.question).split('-').at(-1);
		if (!hearingIdString) {
			throw Error('Could not extract the hearing id from the question');
		}

		const hearingId = Number.parseInt(hearingIdString, 10);
		if (Number.isNaN(hearingId) || hearingId < 1) {
			throw Error('Invalid hearing id');
		}
		return hearingId - 1;
	}
	protected saveToSession(answers: ExaminationInput) {
		if (!this.req.session) {
			throw Error('request has no session data');
		}

		const index = this.getHearingIndex();

		if (!answers.hearings) {
			this.req.session.answers = answers;
			return true;
		}

		const savedHearing = (this.req.session.answers as ExaminationInput | undefined)?.hearings?.[index];
		const mergedHearing: Hearing = { ...savedHearing, ...answers.hearings[index] };

		const hearings = [...answers.hearings];
		hearings[index] = clearOutdatedAnswers(mergedHearing);

		this.req.session.answers = { ...answers, hearings };
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
		const createData: Record<string, any> = { ...answers };
		const updateData: Record<string, any> = { ...answers };
		if ('hearings' in answers) {
			const hearings = sortByCreatedDate(answers.hearings as { createdDate: Date; [key: string]: any }[]);
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
				hearingPostcode: e.hearingPostcode,
				hearingDuration: e.hearingDuration,
				hearingEndDate: e.hearingEndDate
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
