export type SaveInput = object;

export interface CaseOverviewInput extends SaveInput {
	planTitle?: string;
	planType?: string;
	planBand?: string;
	caseOfficer?: string;
	lpa?: string;
	lpaCode?: string;
	lpaContact?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	examinationWebsite?: string;
	// assessor for Gateway 2
	assessorName?: string;
	gateway3AssessorName?: string;
	assessorGateway3?: string;
	examiningInspector1?: string;
	examiningInspector2?: string;
	examiningInspector3?: string;
	qaInspector1?: string;
	qaInspector2?: string;
	qaInspector3?: string;
	//programme Officer for gateway 3
	programmeOfficerFirstName?: string;
	programmeOfficerLastName?: string;
	programmeOfficerEmail?: string;
}

export interface Gateway1Input extends SaveInput {
	noticeOfIntention?: Date;
	expectedGateway1Date?: Date;
	completedGateway1Date?: Date;
	slaSentDate?: Date;
	signedSla?: any;
	slaReceivedDate?: Date;
	dsaChecked?: string;
}

export interface Gateway2Input extends SaveInput {
	expectedDate?: Date;
	actualDate?: Date;
	validDate?: Date;
	assessorName?: string;
	assessorDate?: Date;
	assessorAppointmentDate?: Date;
	workshopDate?: Date;
	workshopVenue?: string;
	reportIssuedDate?: Date;
	reportPublishedByLPA?: Date;
	gateway2Report?: any;
	workshopDocumentUploadedDate?: Date;
	workshopExpectedDays?: string;
	workshopExpectedDaysKnown_workshopExpectedDays?: string;
	workshops?: {
		id: string;
		createdDate: Date;
		workshopComplete: boolean;
		workshopDate: Date | null;
		workshopTime: string | null;
		workshopEndTime: string | null;
		workshopExpectedDaysKnown: string | null;
		workshopExpectedDays: string | null;
		workshopLocationType: string | null;
		remoteMeetingLinkKnown: string | null;
		remoteMeetingLink: string | null;
		workshopLocationKnown: string | null;
		workshopVenueName: string | null;
		workshopAddressLine: string | null;
		workshopAddressLine2: string | null;
		workshopTownOrCity: string | null;
		workshopPostcode: string | null;
	}[];
}

export interface ExaminationInput extends SaveInput {
	expectedSubmissionForExaminationDate?: Date;
	submissionForExaminationDate?: Date;
	examiningInspector1?: string;
	examiningInspector2?: string;
	examiningInspector3?: string;
	examiningInspectorAppointmentDate?: Date;
	examinationWebsite?: string;
	QADate?: Date;
	reportSentToPanelDate?: Date;
	panelResponseToInspectorDate?: Date;
	letterSentToMHCLGDate?: Date;
	letterIssueDate?: Date;
	factCheckDateReceivedFromInspector?: Date;
	factCheckDueDate?: Date;
	factCheckActualDate?: Date;
	factCheckReceivedBackFromLPADate?: Date;
	finalReportIssueDate?: Date;
	qaInspector1?: string;
	qaInspector2?: string;
	qaInspector3?: string;
	planPauseStartDate?: Date;
	planPauseEndDate?: Date;
	withdrawnDate?: Date;
	isSound?: boolean;
	soundUnsoundDate?: Date;
	adoptionDate?: Date;
	approvedForCILDate?: Date;
}

export interface Gateway3Input extends SaveInput {
	expectedDate?: Date;
	actualDate?: Date;
	assessorName?: string;
	assessorAppointmentDate?: Date;
	programmeOfficerFirstName?: string;
	programmeOfficerLastName?: string;
	programmeOfficerEmail?: string;
	examinationWebsite?: string;
	submissions?: {
		id: string;
		decision: string | null;
		completionDate: Date | null;
		gateway3InfoId: string | null;
	}[];
}
