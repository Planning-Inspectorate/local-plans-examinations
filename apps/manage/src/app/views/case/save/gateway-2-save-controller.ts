import { SaveController } from './save-controller.ts';
import { gatway2WorkshopBaseUrls } from '../questions.ts';
import { sortGateway2Workshops } from '#util/util.ts';
import { parseDate } from '../../../util/date.ts';
import type { Gateway2Input } from './save-inputs.ts';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { NUM_GW2_WORKSHOP_QUESTIONS } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

export class Gateway2SaveController extends SaveController {
	private caseId: string | undefined;
	private isGateway2WorkshopQuestion() {
		const question = String(this.req.params.question);
		const matchedQuestion = gatway2WorkshopBaseUrls.find((prefix) => question.startsWith(prefix));
		return !!matchedQuestion;
	}
	protected async shouldSaveToSession() {
		return this.isGateway2WorkshopQuestion();
	}
	protected async prepareData(answers: Record<string, any>) {
		const caseDetails = await this.service.db.case.findUnique({
			select: {
				id: true,
				gateway2Info: {
					select: {
						workshops: true
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
		if (caseDetails.gateway2Info?.workshops == undefined) {
			throw Error(`Could not find workshop data for case with reference '${this.caseReference}'`);
		}
		const question = this.req.params.question ? String(this.req.params.question) : '';
		const matchedQuestion = gatway2WorkshopBaseUrls.find((prefix) => question.startsWith(prefix));
		const submittingCheckYourAnswers = String(this.req.url).includes('check-your-answers');
		if (matchedQuestion || submittingCheckYourAnswers) {
			const workshopIdFromQuestion = parseInt(question.replace(`${matchedQuestion}-`, ''));
			const workshopIdFromUrl = parseInt(String(this.req.url.split('-').at(-1)));
			const workshopId = isNaN(workshopIdFromQuestion) ? workshopIdFromUrl : workshopIdFromQuestion;
			if (!workshopId) {
				throw Error('Could not extract the workshop id');
			}
			const workshopDetails = sortGateway2Workshops(caseDetails.gateway2Info?.workshops);
			if (workshopId > workshopDetails.length) {
				workshopDetails.push({ workshopDate: null, createdDate: new Date() });
			}
			// Enrich the current workshop with the answers
			if (this.req.session && this.req.session.answers && this.req.session.answers.workshops) {
				const filteredSessionAnswerWorkshops = sortGateway2Workshops(this.req.session.answers.workshops);
				workshopDetails[workshopId - 1] = {
					...workshopDetails[workshopId - 1],
					...filteredSessionAnswerWorkshops[workshopId - 1]
				};
			}
			// Copy answer fields to the workshop
			const currentWorkshop = workshopDetails[workshopId - 1];
			const questionFieldsMap = {
				[`gateway-2-workshop-date-and-time-${workshopId}`]: {
					workshopDate: `workshopDate-${workshopId}`,
					workshopTime: `workshopTime-${workshopId}`,
					workshopEndTime: `workshopEndTime-${workshopId}`
				},
				[`gateway-2-workshop-expected-days-${workshopId}`]: {
					workshopExpectedDaysKnown: `workshopExpectedDaysKnown-${workshopId}`,
					workshopExpectedDays: `workshopExpectedDaysKnown-${workshopId}_workshopExpectedDays`
				},
				[`gateway-2-location-type-${workshopId}`]: {
					workshopLocationType: `workshopLocationType-${workshopId}`
				},
				[`gateway-2-workshop-location-known-${workshopId}`]: {
					workshopLocationKnown: `workshopLocationKnown-${workshopId}`
				},
				[`gateway-2-workshop-venue-address-${workshopId}`]: {
					workshopVenueName: `workshopVenueName-${workshopId}`,
					workshopAddressLine: `workshopAddressLine-${workshopId}`,
					workshopAddressLine2: `workshopAddressLine2-${workshopId}`,
					workshopTownOrCity: `workshopTownOrCity-${workshopId}`,
					workshopPostcode: `workshopPostcode-${workshopId}`
				},
				[`gateway-2-remote-meeting-link-known-${workshopId}`]: {
					remoteMeetingLinkKnown: `remoteMeetingLinkKnown-${workshopId}`
				},
				[`gateway-2-remote-meeting-link-${workshopId}`]: {
					remoteMeetingLink: `remoteMeetingLink-${workshopId}`
				}
			};
			const workshopFieldsToAnswerMap: Record<string, string> = Object.assign({}, ...Object.values(questionFieldsMap));
			Object.entries(workshopFieldsToAnswerMap).forEach(([workshopField, answerField]) => {
				const questionAnswer = answers[answerField];
				const matchedSpecificQuestion = Boolean(questionFieldsMap[question]);
				const fieldIsForcurrentQuestion = matchedSpecificQuestion
					? Object.values(questionFieldsMap[question]).includes(answerField)
					: false;
				if (questionAnswer ?? (matchedSpecificQuestion && fieldIsForcurrentQuestion)) {
					currentWorkshop[workshopField] = questionAnswer;
				}
			});
			return {
				workshops: workshopDetails
			};
		}
		return this.trimStringValues(answers as Gateway2Input);
	}
	protected saveToSession(answers: Gateway2Input) {
		const workshopIdString = String(this.req.params.question).split('-').at(-1);
		if (!workshopIdString) {
			throw Error('Could not extract the workshop id from the question');
		}
		const workshopId = parseInt(workshopIdString);
		if (!this.req.session) {
			throw Error('request has no session data');
		}
		if (this.req.session.answers) {
			const sessionAnswers = this.req.session.answers as Gateway2Input;
			const workshopAnswers = sessionAnswers.workshops;
			if (workshopAnswers && answers.workshops) {
				const sessionAnswers = workshopAnswers[workshopId - 1];
				const newAnswers = answers.workshops[workshopId - 1];
				answers.workshops[workshopId - 1] = { ...sessionAnswers, ...newAnswers };
				// Clean related fields
				const currentWorkshop = answers.workshops[workshopId - 1];
				if (currentWorkshop.workshopExpectedDaysKnown == 'no') {
					delete (currentWorkshop as any).workshopExpectedDays;
				}
				if (currentWorkshop.workshopLocationType == 'remote') {
					delete (currentWorkshop as any).workshopVenueName;
					delete (currentWorkshop as any).workshopAddressLine;
					delete (currentWorkshop as any).workshopAddressLine2;
					delete (currentWorkshop as any).workshopTownOrCity;
					delete (currentWorkshop as any).workshopPostcode;
				}
				if (currentWorkshop.remoteMeetingLinkKnown == 'no') {
					delete (currentWorkshop as any).remoteMeetingLink;
				}
			}
		}
		this.req.session.answers = answers;
		return true;
	}

	protected async saveToDatabase(answers: Gateway2Input) {
		const question = String(this.req.params.question);
		if (!this.caseId) {
			throw Error(`save called but caseId was not already fetched - please check that prepareData was called first`);
		}
		if (
			question === COMMON_CONSTS.GATEWAY_2_ASSESSOR_QUESTION ||
			question === COMMON_CONSTS.ASSESSOR_GATEWAY_2_QUESTION
		) {
			answers.assessorAppointmentDate = new Date();
		}

		if (answers.workshopDate) {
			answers.workshopDate = parseDate(answers.workshopDate as any);
		}
		const createData: Record<string, any> = { ...answers };
		const updateData: Record<string, any> = { ...answers };
		if ('workshops' in answers) {
			const workshops = sortGateway2Workshops(answers.workshops as { createdDate: Date; [key: string]: any }[]);
			if (!workshops) {
				throw Error('No workshop entries found');
			}
			const workshopsCleaned = Object.values(workshops).map((e) => ({
				createdDate: e.createdDate,
				workshopDate: e.workshopDate && typeof e.workshopDate == 'string' ? parseDate(e.workshopDate) : e.workshopDate,
				workshopTime: e.workshopTime,
				workshopEndTime: e.workshopEndTime,
				workshopExpectedDaysKnown: e.workshopExpectedDaysKnown,
				workshopExpectedDays: e.workshopExpectedDays,
				workshopLocationType: e.workshopLocationType,
				remoteMeetingLinkKnown: e.remoteMeetingLinkKnown,
				remoteMeetingLink: e.remoteMeetingLink,
				workshopLocationKnown: e.workshopLocationKnown,
				workshopVenueName: e.workshopVenueName,
				workshopAddressLine: e.workshopAddressLine,
				workshopAddressLine2: e.workshopAddressLine2,
				workshopTownOrCity: e.workshopTownOrCity,
				workshopPostcode: e.workshopPostcode
			}));
			if (workshopsCleaned.length > NUM_GW2_WORKSHOP_QUESTIONS) {
				throw Error('Max number of workshop has been exceeded');
			}
			createData['workshops'] = {
				createMany: {
					data: workshopsCleaned
				}
			};
			updateData['workshops'] = {
				deleteMany: {}, // Delete any referenced workshops that have not been sunmitted
				createMany: {
					data: workshopsCleaned
				}
			};
		}
		if (answers) {
			await this.service.db.gateway2Info.upsert({
				where: { caseId: this.caseId },
				update: { ...updateData },
				create: { caseId: this.caseId, ...createData }
			});
			if (this.req.session) {
				delete this.req.session.answers;
			}
			return true;
		}
		return false;
	}
}
