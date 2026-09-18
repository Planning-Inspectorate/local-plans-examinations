import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { questions } from '../questions.ts';
import { loadCaseOfficerOptions, loadInspectorOptions, loadLpaOptions } from '../../../util/options-helper.ts';
import { getOverviewData } from './overview-page-helper.ts';

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

		const overviewData = await getOverviewData(service.db, reference);
		if (!overviewData) {
			res.status(404).render('views/errors/404.njk');
			return;
		}

		await loadCaseOfficerOptions(service, req, questions);
		await loadInspectorOptions(service, req, questions);
		const lpaOptions = await loadLpaOptions(service);
		if (lpaOptions.length > 0) {
			questions.lpa.options = [{ value: '', text: '' }, ...lpaOptions];
		}

		const journeyResponse = new JourneyResponse(journeyId, '', mapOverviewDataToAnswers(overviewData));
		res.locals.journeyResponse = journeyResponse;
		res.locals.currentCase = overviewData;
		res.locals.baseUrl = `/case/${encodeURIComponent(reference)}`;
		res.locals.currentSection = (req.query?.section as string) ?? '';

		if (next) next();
	}
}
