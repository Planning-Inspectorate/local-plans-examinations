import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { OverviewPageLoadHandler, type PageLoadContext } from './overview-page-load-handler.ts';
import { questions } from '../questions.ts';
import { loadCaseOfficerOptions, loadInspectorOptions, loadLpaOptions } from '../../../util/options-helper.ts';
import { getOverviewData } from './overview-page-helper.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';

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
		const caseRecord = await service.db.case.findUnique({
			where: { reference },
			select: { id: true, planTitle: true }
		});

		if (!overviewData || !caseRecord) {
			res.status(404).render('views/errors/404.njk');
			return;
		}

		await loadCaseOfficerOptions(service, req, questions);
		await loadInspectorOptions(service, req, questions);
		const lpaOptions = await loadLpaOptions(service);
		if (lpaOptions.length > 0) {
			questions.lpa.options = [{ value: '', text: '' }, ...lpaOptions];
		}

		const gateway2DocumentSets = {
			procedural: [
				{ folderName: 'covering-letter', title: 'Gateway 2 covering letter' },
				{ folderName: 'local-plan-timetable', title: 'Local plan timetable' },
				{ folderName: 'project-initiation-document', title: 'Project initiation document' },
				{ folderName: 'draft-stat-compliance', title: 'Draft statement of compliance' },
				{ folderName: 'draft-stat-soundness', title: 'Draft statement of soundness' }
			],
			consultation: [
				{ folderName: 'notice-of-intent', title: 'Notice of intention to commence local plan preparation' },
				{ folderName: 'scoping-cons', title: 'Scoping consultation documents' },
				{ folderName: 'cons-summ', title: 'Consultation summary of feedback to scoping consultation' },
				{ folderName: 'g1-self-assess', title: 'Gateway 1 - Self assessment of readiness' },
				{ folderName: 'cons-of-proposed', title: 'Consultation on proposed local plan content and evidence documents' },
				{
					folderName: 'summary-of-consultation',
					title: 'Summary of consultation on proposed local plan content and evidence documents'
				}
			],
			additional: [
				{
					folderName: 'subsequent-work-towards-a-draft-plan',
					title: 'Subsequent work towards a draft plan'
				}
			]
		};

		const allDocumentSets = Object.values(gateway2DocumentSets).flat();

		const documentSetIds = await DocumentUtil.getDocumentSetIdsByFolderName(
			service,
			allDocumentSets.map(({ folderName }) => folderName)
		);

		const documentsByCategory = await Promise.all(
			Object.entries(gateway2DocumentSets).map(async ([category, documentSets]) => ({
				category,
				documents: await Promise.all(
					documentSets.map(async ({ folderName, title }) => {
						const documentSetId = documentSetIds.get(folderName);

						const files = documentSetId
							? await DocumentUtil.loadUploadedDocuments(service, caseRecord.id, documentSetId)
							: [];

						return {
							title,
							files
						};
					})
				)
			}))
		);

		const journeyResponse = new JourneyResponse(journeyId, '', mapOverviewDataToAnswers(overviewData));
		journeyResponse.answers.gateway2Documents = documentsByCategory;
		res.locals.journeyResponse = journeyResponse;
		res.locals.currentCase = overviewData;
		res.locals.baseUrl = `/case/${encodeURIComponent(reference)}`;
		res.locals.currentSection = (req.query?.section as string) ?? '';

		if (next) next();
	}
}
