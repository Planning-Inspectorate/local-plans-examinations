import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';

export const GATEWAY_2_REPORT_DOCUMENT_SET_ID = 'g2-report';

export type Gateway2ReportFileViewModel = {
	fileName: string;
	href?: string;
	sharedDate?: string;
};

export function buildGateway2ReportFilesViewModel(
	planReference: string | undefined,
	files: UploadedFile[]
): Gateway2ReportFileViewModel[] {
	const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;

	return files.map((file) => {
		const documentGuid = file.metadata?.documentGuid;
		const fileName = decodeFileName(file.fileName);

		return {
			fileName,
			href:
				encodedPlanReference && typeof documentGuid === 'string' && documentGuid
					? `/manage-local-plans/${encodedPlanReference}/gateway-2-submission/download-document/${encodeURIComponent(
							documentGuid
						)}`
					: undefined,
			sharedDate: file.dateCreated ? formatDisplayDate(file.dateCreated) : undefined
		};
	});
}

function formatDisplayDate(date: Date | null | undefined): string | undefined {
	if (!date) {
		return undefined;
	}

	return date.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

function decodeFileName(fileName: string) {
	try {
		return decodeURIComponent(fileName);
	} catch {
		return fileName;
	}
}
