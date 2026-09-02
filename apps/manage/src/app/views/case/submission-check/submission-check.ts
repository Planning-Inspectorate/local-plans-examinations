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

/**
 * Abstract class that can be used to generate the data for the `submit-documents-check-your-answers` page.
 *
 * ### Example usage
 * ```
 * const submissionCheck = SubmissionCheck(...);
 * const submissionCheckData = await SubmissionCheck.generateDataForPage();
 * ```
 */
export abstract class SubmissionCheck {
	/**
	 * Generate an object that contains the details for the submit-documents-check-your-answers page
	 */
	public abstract generateDataForPage(
		caseId: string,
		caseReference: string,
		journeyId: string,
		section: string,
		questionUrl: string,
		originalUrl: string,
		service: ManageService,
		uploadedFiles: any
	): Promise<SubmissionCheckData>;

	/**
	 * Generate a back link url from the given url
	 * @param url The url to parse
	 * @returns A back url from the given url
	 */
	protected generateBackUrl(url: string): string {
		return `${url.substring(0, url.lastIndexOf('/'))}`;
	}
}
