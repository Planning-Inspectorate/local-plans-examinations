import { formatDisplayDate } from '#util/date.ts';
import type { Gateway2ReportFile } from '../../types.ts';

export type Gateway2ReportFileViewModel = {
	fileName: string;
	href?: string;
	sharedDate?: string;
};

export function buildGateway2ReportFilesViewModel(
	planReference: string | undefined,
	files: Gateway2ReportFile[]
): Gateway2ReportFileViewModel[] {
	const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;

	return files.map((file) => {
		const fileName = decodeFileName(file.fileName);

		return {
			fileName,
			href:
				encodedPlanReference && file.documentGuid
					? `/manage-local-plans/${encodedPlanReference}/gateway-2-submission/download-document/${encodeURIComponent(
							file.documentGuid
						)}`
					: undefined,
			sharedDate: formatDisplayDate(file.dateCreated)
		};
	});
}

function decodeFileName(fileName: string) {
	try {
		return decodeURIComponent(fileName);
	} catch {
		return fileName;
	}
}
