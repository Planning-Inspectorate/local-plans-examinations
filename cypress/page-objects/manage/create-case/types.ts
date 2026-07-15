import type { DisplayDateAnswer } from '../../../types/date.ts';

export type SelectAnswer = {
	value: string;
	label: string;
};

export type CreateCaseData = {
	caseOfficer: SelectAnswer;
	planTitle: string;
	planType: SelectAnswer;
	lpa: SelectAnswer[];
	contact: {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		lpaContact: SelectAnswer;
	};
	dates: {
		intentionToCommenceDate: DisplayDateAnswer;
		gateway1Date: DisplayDateAnswer;
		gateway2Date: DisplayDateAnswer;
		gateway3Date: DisplayDateAnswer;
		submissionDate: DisplayDateAnswer;
	};
};
