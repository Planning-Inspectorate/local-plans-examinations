import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { JourneyDataLoadHandler, type JourneyDataLoadContext } from './journey-data-load-handler.ts';
import { getOverviewData } from './journey-data.ts';

export class OverviewDataLoadHandler extends JourneyDataLoadHandler {
	public async handle(context: JourneyDataLoadContext): Promise<void> {
		const { req, res, next, service, journeyId, reference } = context;

		const overviewData = await getOverviewData(service.db, reference);
		if (!overviewData) {
			res.status(404).render('views/errors/404.njk');
			return;
		}

		const journeyResponse = new JourneyResponse(journeyId, '', overviewData);
		res.locals.journeyResponse = journeyResponse;
		res.locals.currentCase = overviewData;
		res.locals.baseUrl = `/case/${encodeURIComponent(reference)}`;
		res.locals.currentSection = (req.query?.section as string) ?? '';

		Object.assign(
			journeyResponse.answers,
			overviewData.gateway2Info,
			overviewData.gateway3Info,
			overviewData.examinationInfo
		);
		journeyResponse.answers.assessorName = overviewData.gateway2Info?.assessorName;
		journeyResponse.answers.gateway3AssessorName = overviewData.gateway3Info?.assessorName;

		journeyResponse.answers.checkLpas = overviewData.lpas.map((lpa) => ({
			id: lpa.lpaCode,
			lpa: lpa.lpaCode
		}));
		journeyResponse.answers.contactDetails = overviewData.contacts.map((contact) => ({
			...contact,
			phone: contact.phoneNumber,
			lpaContact: contact.lpaCode
		}));

		if (next) next();
	}
}
