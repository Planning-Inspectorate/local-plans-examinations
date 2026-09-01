import { type ManageService } from '#service';

export type SubmissionCheckData = {
	titleHeading: string;
	uploadedFiles: string[];
	caseReference: string;
	journeyId: string;
	section: string;
	question: string;
	backLink: string;
	notificationPreviewTemplate: string;
	submitButtonText: string;
	additionalFields: { name: string; value: string | null; url: string | undefined | null }[];
};

export abstract class SubmissionCheck {
	caseId: string;
	caseReference: string;
	journeyId: string;
	section: string;
	questionUrl: string;
	originalUrl: string;
	service: ManageService;
	uploadedFiles: any;
	constructor(
		caseId: string,
		caseReference: string,
		journeyId: string,
		section: string,
		questionUrl: string,
		originalUrl: string,
		service: ManageService,
		uploadedFiles: any
	) {
		this.caseId = caseId;
		this.caseReference = caseReference;
		this.journeyId = journeyId;
		this.section = section;
		this.questionUrl = questionUrl;
		this.originalUrl = originalUrl;
		this.service = service;
		this.uploadedFiles = uploadedFiles;
	}
	/**
	 * Generate an object that contains the details for the submit-documents-check-your-answers page
	 */
	public abstract generateDataForPage(): Promise<SubmissionCheckData>;

	protected generateBackUrl(url: string): string {
		return `${url.substring(0, url.lastIndexOf('/'))}`;
	}
}
