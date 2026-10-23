import { type ManageService } from '#service';
import type { UploadedFile } from '@pins/local-plans-lib/storage/types.ts';
import { fileUploadDownloadFormat } from '@pins/local-plans-lib/forms/custom-components/file-uploader/question.ts';

export type SubmissionCheckData = {
	titleHeading: string;
	answersToReview: {
		name: string;
		value: string | null;
		url: string | undefined;
	}[];
	caseReference: string;
	journeyId: string;
	section: string;
	question: string;
	backLink: string;
	notificationPreviewTemplate?: string;
	submitButtonText: string;
	notificationTextLPA?: string;
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

	protected generateBaseUrl(url: string): string {
		return url.split('/').slice(0, 3).join('/');
	}

	protected formatDocuments(
		uploadedFiles: UploadedFile[],
		documentDownloadBaseUrl: string,
		documentChangeBaseUrl: string,
		query?: string
	) {
		const answersToReview: { name: string; value: string; url: string }[] = [];
		let documentCounter = 1;
		for (const file of uploadedFiles) {
			const downloadUrl = `${documentDownloadBaseUrl}/${file.metadata?.documentGuid}`;
			if (!file.metadata?.documentGuid) {
				throw Error(`documentGuid is missing for document with name ${file.fileName}, path ${file.path}`);
			}
			const queryString = query ? `?${query}` : '';
			const changeUrl = `${documentChangeBaseUrl}${queryString}`;
			answersToReview.push({
				name: `Document ${documentCounter}`,
				value: fileUploadDownloadFormat(file, downloadUrl),
				url: changeUrl
			});
			documentCounter += 1;
		}
		return answersToReview;
	}
}
