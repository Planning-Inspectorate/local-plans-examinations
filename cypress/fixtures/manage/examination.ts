// seed-cy.ts sets expectedSubmissionDate to `now` at seed time
// unlike a real case, where it comes from a fixed value answered during case creation. If seed-cy.ts is
// ever changed to a fixed date instead, this dynamic today/todayInput/todayDisplay block can be removed

const today = new Date();

const todayInput = {
	day: String(today.getDate()),
	month: String(today.getMonth() + 1),
	year: String(today.getFullYear())
};

const todayDisplay = today.toLocaleDateString('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'GMT'
});

export const expectedSubmissionDate = {
	row: 'Expected submission date',
	heading: 'When is the expectedexamination date?',
	fieldName: 'expectedubmissionForExaminationDate',
	path: 'examination-expected-submission-date',
	input: todayInput,
	display: todayDisplay,
	updatedInput: { day: '10', month: '10', year: '2026' },
	updatedDisplay: '10 October 2026'
};

export const actualSubmissionDate = {
	row: 'Actual submission date',
	heading: 'When is the actual examination date?',
	fieldName: 'submissionForExaminationDate',
	path: 'examination-actual-submission-date',
	input: { day: '1', month: '9', year: '2026' },
	display: '1 September 2026',
	updatedInput: { day: '9', month: '12', year: '2026' },
	updatedDisplay: '9 December 2026'
};

export const examinationSubmissionDates = [expectedSubmissionDate, actualSubmissionDate];

export const examiningInspector1 = {
	row: 'Examining Inspector 1',
	heading: 'Which Inspector is assigned for Examination?',
	fieldName: 'examiningInspector1',
	path: 'examining-inspector-1',
	display: 'Inspector 1',
	updatedInput: 'Inspector 4'
};

export const examiningInspector2 = {
	row: 'Examining Inspector 2',
	heading: 'Which Inspector is assigned for Examination?',
	fieldName: 'examiningInspector2',
	path: 'examining-inspector-2',
	display: 'Inspector 2'
};

export const examiningInspector3 = {
	row: 'Examining Inspector 3',
	heading: 'Which Inspector is assigned for Examination?',
	fieldName: 'examiningInspector3',
	path: 'examining-inspector-3',
	display: 'Inspector 3'
};

export const examiningInspectorAppointmentDate = {
	row: 'Examining Inspector(s) appointment date',
	heading: 'When were the examining Inspectors appointed?',
	fieldName: 'examiningInspectorAppointmentDate',
	path: 'examination-examining-inspector-appointment-date',
	input: { day: '1', month: '9', year: '2026' },
	display: '1 September 2026',
	updatedInput: { day: '2', month: '9', year: '2026' },
	updatedDisplay: '2 September 2026'
};

export const examiningInspectors = [
	examiningInspector1,
	examiningInspector2,
	examiningInspector3,
	examiningInspectorAppointmentDate
];

export const examinationWebsite = {
	row: 'Examination website',
	heading: 'What is the address of the examination website?',
	fieldName: 'examinationWebsite',
	path: 'examination-website',
	value: 'www.gov.uk/register-to-vote',
	display: 'Not started',
	href: 'https://www.gov.uk/register-to-vote',
	updatedValue: 'www.updated-example.com'
};

export const letterSentToMHCLGDate = {
	row: 'Letter sent to MHCLG date',
	heading: 'When was the 48-hour protocol letter sent to MHCLG?',
	fieldName: 'letterSentToMHCLGDate',
	path: 'letter-sent-to-mhclg-date',
	input: { day: '1', month: '10', year: '2026' },
	display: '1 October 2026',
	updatedInput: { day: '15', month: '12', year: '2026' },
	updatedDisplay: '15 December 2026'
};

export const letterIssueDate = {
	row: 'Letter issue date',
	heading: 'When was the letter sent to the LPA?',
	fieldName: 'letterIssueDate',
	path: 'letter-issue-date',
	input: { day: '1', month: '11', year: '2026' },
	display: '1 November 2026'
};

export const examinationLetterDates = [letterSentToMHCLGDate, letterIssueDate];

export const factCheckDateReceivedFromInspector = {
	row: 'Fact Check date received from Inspector',
	heading: 'When did the Inspector issue the Fact Check?',
	fieldName: 'factCheckDateReceivedFromInspector',
	path: 'fact-check-date-received-from-inspector',
	input: { day: '1', month: '10', year: '2026' },
	display: '1 October 2026',
	updatedInput: { day: '15', month: '12', year: '2026' },
	updatedDisplay: '15 December 2026'
};

export const factCheckDueDate = {
	row: 'Fact Check due date',
	heading: 'When is the Fact Check expected to be sent to the LPA?',
	fieldName: 'factCheckDueDate',
	path: 'fact-check-due-date',
	input: { day: '1', month: '11', year: '2026' },
	display: '1 November 2026',
	updatedInput: { day: '16', month: '12', year: '2026' },
	updatedDisplay: '16 December 2026'
};

export const factCheckActualDate = {
	row: 'Fact Check actual date',
	heading: 'When was the Fact Check actually sent to the LPA?',
	fieldName: 'factCheckActualDate',
	path: 'fact-check-actual-date',
	input: { day: '1', month: '12', year: '2026' },
	display: '1 December 2026',
	updatedInput: { day: '17', month: '12', year: '2026' },
	updatedDisplay: '17 December 2026'
};

export const factCheckReceivedBackFromLpaDate = {
	row: 'Fact Check received back from LPA',
	heading: 'When was the Fact Check returned?',
	fieldName: 'factCheckReceivedBackFromLPADate',
	path: 'fact-check-received-back-from-lpa-date',
	input: { day: '2', month: '12', year: '2026' },
	display: '2 December 2026',
	updatedInput: { day: '18', month: '12', year: '2026' },
	updatedDisplay: '18 December 2026'
};

export const finalReportIssueDate = {
	row: 'Final report issue date',
	heading: 'When was the final report issued?',
	fieldName: 'finalReportIssueDate',
	path: 'final-report-issue-date',
	input: { day: '3', month: '12', year: '2026' },
	display: '3 December 2026',
	updatedInput: { day: '19', month: '12', year: '2026' },
	updatedDisplay: '19 December 2026'
};
export const QADateAnswers = {
	QADate: {
		row: 'QA date',
		heading: 'What is the date of QA?',
		fieldName: 'QADate',
		path: 'qa-date',
		display: '4 December 2026'
	},

	sentToPanelDate: {
		row: 'Sent to panel date',
		heading: 'When was the report sent to the panel?',
		fieldName: 'reportSentToPanelDate',
		path: 'report-sent-to-panel-date',
		display: '5 December 2026'
	},

	QAPanelResponseDate: {
		row: 'QA panel response sent to Inspector',
		heading: 'When did the panel send its QA response to the Inspector?',
		fieldName: 'panelResponseToInspectorDate',
		path: 'panel-response-to-inspector-date',
		input: { day: '6', month: '12', year: '2026' },
		display: '6 December 2026',
		updatedInput: { day: '22', month: '12', year: '2026' },
		updatedDisplay: '22 December 2026'
	}
};

export const QAInspectorsAnswers = {
	QAInspector1: {
		row: 'QA Inspector 1',
		heading: 'Which Inspector is assigned for QA?',
		fieldName: 'qaInspector1',
		path: 'qa-inspector-1',
		input: 'Inspector 1',
		display: 'Inspector 1',
		updatedInput: 'Inspector 2',
		updatedDisplay: 'Inspector 2'
	},

	QAInspector2: {
		row: 'QA Inspector 2',
		heading: 'Which Inspector is assigned for QA?',
		fieldName: 'qaInspector2',
		path: 'qa-inspector-2',
		display: 'Inspector 2'
	},

	QAInspector3: {
		row: 'QA Inspector 3',
		heading: 'Which Inspector is assigned for QA?',
		fieldName: 'qaInspector3',
		path: 'qa-inspector-3',
		display: 'Inspector 3'
	}
};

export const examinationFactCheckDates = [
	factCheckDateReceivedFromInspector,
	factCheckDueDate,
	factCheckActualDate,
	factCheckReceivedBackFromLpaDate,
	finalReportIssueDate
];

export const QAExpectedAnswers = [
	...Object.values(QADateAnswers).map(({ row, display, path }) => ({ row, display, path })),
	...Object.values(QAInspectorsAnswers).map(({ row, display, path }) => ({ row, display, path }))
];

export const planPauseStartDate = {
	row: 'Plan pause date',
	heading: 'When did the plan pause start?',
	fieldName: 'planPauseStartDate',
	path: 'plan-pause-start-date',
	input: { day: '4', month: '12', year: '2026' },
	display: '4 December 2026',
	updatedInput: { day: '20', month: '12', year: '2026' },
	updatedDisplay: '20 December 2026'
};

export const planPauseEndDate = {
	row: 'Plan pause end date',
	path: 'plan-pause-end-date',
	display: '5 December 2026'
};

export const withdrawnDate = {
	row: 'Withdrawn date',
	path: 'withdrawn-date',
	display: '6 December 2026'
};

export const soundUnsound = {
	row: 'Sound / unsound',
	heading: 'Was the plan found to be sound or unsound?',
	fieldName: 'isSound',
	path: 'is-sound',
	value: 'yes',
	display: 'Sound',
	updatedValue: 'no',
	updatedDisplay: 'Unsound'
};

export const soundUnsoundDate = {
	row: 'Sound / unsound date',
	path: 'sound-unsound-date',
	display: '7 December 2026'
};

export const adoptionDate = {
	row: 'Adoption date',
	path: 'adoption-date',
	display: '8 December 2026'
};

export const approvedForCILDate = {
	row: 'Approved for CIL date',
	path: 'approved-for-cil-date',
	display: '9 December 2026'
};

export const examinationImportantDates = [
	planPauseStartDate,
	planPauseEndDate,
	withdrawnDate,
	soundUnsound,
	soundUnsoundDate,
	adoptionDate,
	approvedForCILDate
];
