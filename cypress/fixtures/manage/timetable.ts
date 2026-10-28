import type { SeedCyOptions } from '../../../packages/database/src/seed/seed-cy.ts';
import { gateway1DateAnswers } from './gateway-1.ts';
import { gateway2DateAnswers, seededGateway2Workshop, workshopSetUp } from './gateway-2.ts';
import { gateway3CompletionDate, gateway3DateAnswers } from './gateway-3.ts';
import {
	actualSubmissionDate,
	examinationFactCheckDates,
	examinationImportantDates,
	examinationLetterDates,
	expectedSubmissionDate,
	hearingDateAndTime,
	QADateAnswers,
	seededExaminationHearing,
	seededRestartedExamination
} from './examination.ts';

export const seededTimetable = {
	...seededRestartedExamination,
	workshops: [
		seededGateway2Workshop,
		{
			...seededGateway2Workshop,
			createdDate: '2026-09-02T12:00:00.000Z',
			workshopDate: '2026-12-10T12:00:00.000Z'
		}
	],
	examination: {
		...seededRestartedExamination.examination,
		expectedSubmissionForExaminationDate: '2026-10-10T12:00:00.000Z',
		submissionForExaminationDate: '2026-09-01T12:00:00.000Z',
		letterSentToMHCLGDate: '2026-10-01T12:00:00.000Z',
		letterIssueDate: '2026-11-01T12:00:00.000Z',
		QADate: '2026-12-04T12:00:00.000Z',
		reportSentToPanelDate: '2026-12-05T12:00:00.000Z',
		panelResponseToInspectorDate: '2026-12-06T12:00:00.000Z',
		factCheckDateReceivedFromInspector: '2026-10-01T12:00:00.000Z',
		factCheckDueDate: '2026-11-01T12:00:00.000Z',
		factCheckActualDate: '2026-12-01T12:00:00.000Z',
		factCheckReceivedBackFromLPADate: '2026-12-02T12:00:00.000Z',
		finalReportIssueDate: '2026-12-03T12:00:00.000Z',
		withdrawnDate: '2026-12-06T12:00:00.000Z',
		isSound: 'sound',
		soundUnsoundDate: '2026-12-07T12:00:00.000Z',
		adoptionDate: '2026-12-08T12:00:00.000Z',
		approvedForCILDate: '2026-12-09T12:00:00.000Z',
		hearings: {
			create: [
				{ ...seededExaminationHearing, hearingComplete: true },
				{
					...seededExaminationHearing,
					createdDate: '2026-10-02T12:00:00.000Z',
					hearingDate: '2026-11-08T00:00:00.000Z',
					hearingComplete: true
				}
			]
		}
	}
} satisfies SeedCyOptions;

type TimetableRow = { row: string; display: string | string[]; path?: string };

const dateRows = (section: string, answers: Required<TimetableRow>[]) =>
	answers.map((answer) => ({ ...answer, path: `timetable/${section}/${answer.path}` }));

export const timetableSections: Record<string, TimetableRow[]> = {
	Timetable: dateRows('timetable', [gateway1DateAnswers.noticeOfIntention]),
	'Gateway 1': dateRows('gateway-1', [
		gateway1DateAnswers.expectedGateway1Date,
		gateway1DateAnswers.completedGateway1Date,
		gateway1DateAnswers.slaSentDate,
		gateway1DateAnswers.slaReceivedDate
	]),
	'Gateway 2': [
		...dateRows('gateway-2', [gateway2DateAnswers.gateway2ExpectedDate, gateway2DateAnswers.gateway2ActualDate]),
		{
			row: 'Workshop dates',
			display: ['1 October 2026', workshopSetUp.workshopDateAndTime.display],
			path: 'gateway-2'
		},
		...dateRows('gateway-2', [
			{ row: 'Report issued date', display: '1 September 2026', path: 'gateway-2-report-issued-date' },
			gateway2DateAnswers.reportPublishedDate
		])
	],
	'Gateway 3': dateRows('gateway-3', [
		gateway3DateAnswers.gateway3ExpectedDate,
		gateway3DateAnswers.gateway3ActualDate,
		{ ...gateway3CompletionDate, path: 'timetable-gateway-3-completion-date', display: '1 September 2026' }
	]),
	Examination: [
		...dateRows('examination', [
			{ ...expectedSubmissionDate, display: expectedSubmissionDate.updatedDisplay },
			actualSubmissionDate
		]),
		{
			row: 'Hearing dates',
			display: [hearingDateAndTime.display, hearingDateAndTime.updatedDisplay],
			path: 'examination'
		},
		...dateRows('examination', examinationLetterDates)
	],
	QA: dateRows('QA', Object.values(QADateAnswers)),
	'Fact Check': [
		...dateRows('fact-check', examinationFactCheckDates),
		{
			row: 'Examination pause date',
			display: '1 September 2026'
		},
		{
			row: 'Examination restart date',
			display: '2 September 2026'
		},
		...dateRows('fact-check', examinationImportantDates)
	]
};
