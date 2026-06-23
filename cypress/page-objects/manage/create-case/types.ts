export type SelectAnswer = {
	value: string;
	label: string;
};

export type DateAnswer = {
	day: string;
	month: string;
	year: string;
	display: string;
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
		intentionToCommenceDate: DateAnswer;
		gateway1Date: DateAnswer;
		gateway2Date: DateAnswer;
		gateway3Date: DateAnswer;
		submissionDate: DateAnswer;
	};
};
