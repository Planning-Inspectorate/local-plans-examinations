import type { BaseValidator, StringValidator } from '@planning-inspectorate/dynamic-forms';
import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { questions } from '../questions.ts';
import { loadCaseOfficerOptions, loadInspectorOptions, loadLpaOptions } from '../../../util/options-helper.ts';
import { getOverviewData } from './overview-page-helper.ts';
import { OverviewSaveController } from '../save/overview-save-controller.ts';
import * as authSession from '@planning-inspectorate/core/auth';
import { consumeAlertsFromSession } from '../../../util/alert.ts';

type OverviewData = NonNullable<Awaited<ReturnType<typeof getOverviewData>>>;

export function mapOverviewDataToAnswers(overviewData: OverviewData): Record<string, any> {
	return {
		...overviewData,
		assessorName: overviewData.gateway2Info?.assessorName,
		gateway3AssessorName: overviewData.gateway3Info?.assessorName,
		programmeOfficerFirstName: overviewData.gateway3Info?.programmeOfficerFirstName,
		programmeOfficerLastName: overviewData.gateway3Info?.programmeOfficerLastName,
		programmeOfficerEmail: overviewData.gateway3Info?.programmeOfficerEmail,
		examiningInspector1: overviewData.examinationInfo?.examiningInspector1,
		examiningInspector2: overviewData.examinationInfo?.examiningInspector2,
		examiningInspector3: overviewData.examinationInfo?.examiningInspector3,
		examinationWebsite: overviewData.examinationInfo?.examinationWebsite,
		qaInspector1: overviewData.examinationInfo?.qaInspector1,
		qaInspector2: overviewData.examinationInfo?.qaInspector2,
		qaInspector3: overviewData.examinationInfo?.qaInspector3,
		checkLpas: overviewData.lpas.map((lpa) => ({
			id: lpa.lpaCode,
			lpa: lpa.lpaCode
		})),
		contactDetails: overviewData.contacts.map((contact) => ({
			...contact,
			phone: contact.phoneNumber,
			lpaContact: contact.lpaCode
		}))
	};
}

export class OverviewTabHandler extends OverviewPageLoadHandler {
	public async handle(context: PageLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, reference } = context;
		if (!req.params.question && req.method == 'GET') {
			await this.tryAddPauseStatusBanner(context);
			consumeAlertsFromSession(req, res);
		}

		const overviewData = await getOverviewData(service.db, reference);
		if (!overviewData) {
			res.status(404).render('views/errors/404.njk');
			return;
		}

		await loadCaseOfficerOptions(service, req, questions);
		await loadInspectorOptions(service, req, questions);
		await loadLpaOptions(service, true);

		const journeyResponse = new JourneyResponse(journeyId, '', mapOverviewDataToAnswers(overviewData));
		res.locals.journeyResponse = journeyResponse;
		res.locals.currentCase = overviewData;
		res.locals.baseUrl = `/case/${encodeURIComponent(reference)}`;
		res.locals.currentSection = (req.query?.section as string) ?? '';
		if (String(req.url).includes('case-details/case-notes')) {
			if (req.method == 'POST') {
				const newNote = String(req.body.note).trim();
				const currentUserAccount = authSession.getAccount(req.session);
				const currentUserName = currentUserAccount?.name ?? 'Unknown';
				if (
					newNote.length >= (questions.caseNotes.validators[0] as StringValidator).minLength.minLength &&
					newNote.length <= (questions.caseNotes.validators[0] as StringValidator).maxLength.maxLength
				) {
					// Save the case note if below the max character count
					await new OverviewSaveController(service, req, reference, String(req.params.section)).prepareAndSave({
						notes: [
							{
								text: newNote,
								createdTime: new Date(),
								createdBy: currentUserName
							}
						]
					});
					delete req.session.errors;
					delete req.session.errorSummary;
				} else {
					const message =
						newNote.length == 0
							? 'Please ensure your note contains text'
							: (questions.caseNotes.validators[0] as StringValidator).maxLength.maxLengthMessage;
					// Add the error message to the session, which will be dealt when redirecting
					req.session.errors = { notes: { msg: message } };
					req.session.errorSummary = (questions.caseNotes.validators as BaseValidator[]).map((elem) => ({
						text:
							newNote.length > (elem as StringValidator).maxLength.maxLength
								? (elem as StringValidator).maxLength.maxLengthMessage
								: (elem as StringValidator).minLength.minLengthMessage,
						href: '#notes'
					}));
				}
				const caseReference = String(req.params.reference);
				res.redirect(`/case/${caseReference}/overview`);
				return;
			}
		}
		if (req.method == 'GET') {
			// If errors are found in the session (from the POST request)
			if (req.session.errors && req.session.errorSummary) {
				// Add errors to the journey response (this is for case notes only) - these are attcehed to the form in the question
				(journeyResponse as any).error = {
					errors: req.session.errors,
					errorSummary: req.session.errorSummary
				};
				// Add errors to the top of the page
				res.locals.errors = req.session.errors;
				res.locals.errorSummary = req.session.errorSummary;
				delete req.session.errors;
				delete req.session.errorSummary;
			}
		}
		this.addVirusScanStatusToLocals(req, res, journeyId);
		if (next) next();
	}
}
