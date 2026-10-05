import type { Request } from 'express';
import { SaveController } from './save-controller.ts';
import type { ExaminationInput } from './save-inputs.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { examinationHearingBaseUrls } from '../questions.ts';
import { filterExaminationHearings, sortExaminationHearings } from '#util/util.ts';
import { parseDate } from '../../../util/date.ts';
import { NUM_EXAMINATION_HEARING_QUESTIONS } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

export class ExaminationSaveController extends SaveController {
	private caseId: string | undefined;
	protected async prepareData(req: Request, answers: Record<string, any>) {
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
		if (!caseDetails.examinationInfo?.hearings) {
			throw Error(`Could not find hearing data for case with reference '${this.caseReference}'`);
		}
		const question = req.params.question ? String(req.params.question) : '';
		const matchedQuestion = examinationHearingBaseUrls.find((prefix) => question.startsWith(prefix));
		const submittingCheckYourAnswers = String(req.url).includes('check-your-answers');
		if (matchedQuestion || submittingCheckYourAnswers) {
			const hearingId = Number(question.replace(`${matchedQuestion}-`, '') || req.url.split('-').at(-1));
			if (!hearingId) {
				throw Error('Could not extract the hearing id');
			}
			const hearingDetails = filterExaminationHearings(
				sortExaminationHearings(caseDetails.examinationInfo?.hearings),
				hearingId - 1
			);
			if (hearingId > hearingDetails.length) {
				hearingDetails.push({ hearingDate: null, createdDate: new Date(), hearingComplete: false });
			}
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
						hearingDetails[hearingId - 1][hearingField] = parseDate(questionAnswer);
					} else {
						hearingDetails[hearingId - 1][hearingField] = questionAnswer;
					}
				}
			});
			if (submittingCheckYourAnswers) {
				console.log('updating hearingComplete');
				hearingDetails[hearingId - 1].hearingComplete = true;
				console.log(hearingDetails[hearingId - 1]);
			}
			return {
				hearings: hearingDetails
			};
		}
		return this.trimStringValues(answers as ExaminationInput);
	}

	protected async save(answers: ExaminationInput, question?: string) {
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

		if ('hearingExpectedDaysKnown_hearingExpectedDays' in answers) {
			answers.hearingExpectedDays = answers.hearingExpectedDaysKnown_hearingExpectedDays;

			delete answers.hearingExpectedDaysKnown_hearingExpectedDays;
		}
		const createData: Record<string, any> = { ...answers };
		const updateData: Record<string, any> = { ...answers };
		if ('hearings' in answers) {
			const hearings = sortExaminationHearings(
				answers.hearings as { createdDate: Date; hearingComplete: boolean; [key: string]: any }[]
			);
			if (!hearings) {
				throw Error('No hearing entries found');
			}
			const hearingsCleaned = Object.values(hearings).map((e) => ({
				hearingComplete: e.hearingComplete,
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
