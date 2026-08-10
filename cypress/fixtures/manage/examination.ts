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
