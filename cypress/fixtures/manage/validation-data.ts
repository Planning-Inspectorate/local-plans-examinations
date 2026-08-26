import type { DateAnswer } from '../../types/date.ts';

type invalidDates = {
	input: DateAnswer;
	errorMessage: string;
};

export const invalidDates = {
	characterDayDate: {
		input: { day: 'a', month: '6', year: '2026' },
		errorMessage: 'day must be a real day'
	},
	characterMonthDate: {
		input: { day: '15', month: 'b', year: '2026' },
		errorMessage: 'month must be between 1 and 12'
	},
	characterYearDate: {
		input: { day: '15', month: '6', year: 'c' },
		errorMessage: 'year must include 4 numbers'
	},
	aboveDayRangeDate: {
		input: { day: '32', month: '6', year: '2026' },
		errorMessage: 'day must be a real day'
	},
	aboveMonthRangeDate: {
		input: { day: '15', month: '13', year: '2026' },
		errorMessage: 'month must be between 1 and 12'
	},
	aboveYearRangeDate: {
		input: { day: '15', month: '6', year: '10000' },
		errorMessage: 'year must include 4 numbers'
	},
	belowDayRangeDate: {
		input: { day: '0', month: '6', year: '2026' },
		errorMessage: 'day must be a real day'
	},
	belowMonthRangeDate: {
		input: { day: '15', month: '0', year: '2026' },
		errorMessage: 'month must be between 1 and 12'
	},
	belowYearRangeDate: {
		input: { day: '15', month: '6', year: '900' },
		errorMessage: 'year must include 4 numbers'
	}
} as const satisfies Record<string, invalidDates>;

export const invalidDateInputs = [
	...Object.values(invalidDates).map(({ input, errorMessage }) => ({ input, errorMessage }))
];
