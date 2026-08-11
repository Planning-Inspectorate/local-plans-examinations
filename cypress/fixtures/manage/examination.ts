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

export const examinationFactCheckDates = [
	factCheckDateReceivedFromInspector,
	factCheckDueDate,
	factCheckActualDate,
	factCheckReceivedBackFromLpaDate,
	finalReportIssueDate
];
