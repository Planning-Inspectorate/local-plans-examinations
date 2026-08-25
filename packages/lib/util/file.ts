const WORD_DOCUMENT_MIME_TYPES = [
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const POWERPOINT_MIME_TYPES = [
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

const EXCEL_MIME_TYPES = [
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-excel.sheet.macroenabled.12',
	'application/vnd.ms-excel.sheet.macroEnabled.12'
];

const OUTLOOK_MIME_TYPES = ['application/vnd.ms-outlook', 'application/octet-stream'];

const MPEG_MIME_TYPES = ['video/mpeg', 'audio/mpeg'];

const JPEG_MIME_TYPES = ['image/jpeg'];

const TIFF_MIME_TYPE = ['image/tiff'];

export const MIME_TYPE_MAP: Record<string, string[]> = {
	pdf: ['application/pdf'],
	doc: WORD_DOCUMENT_MIME_TYPES,
	docx: WORD_DOCUMENT_MIME_TYPES,
	ppt: POWERPOINT_MIME_TYPES,
	pptx: POWERPOINT_MIME_TYPES,
	xls: EXCEL_MIME_TYPES,
	xlsx: EXCEL_MIME_TYPES,
	msg: OUTLOOK_MIME_TYPES,
	jpg: JPEG_MIME_TYPES,
	jpeg: JPEG_MIME_TYPES,
	mpeg: MPEG_MIME_TYPES,
	mp3: MPEG_MIME_TYPES,
	mp4: ['video/mp4'],
	mov: ['video/quicktime'],
	png: ['image/png'],
	tif: TIFF_MIME_TYPE,
	tiff: TIFF_MIME_TYPE
};

/**
 * Convert a numeric value representing an amount of byte into a human-readable string
 *
 * ```
 * e.g: formatByteCountIntoHumanReadableMemoryUnit(8) -> '8 B'
 * e.g: formatByteCountIntoHumanReadableMemoryUnit(1000) -> '1 KB'
 * e.g: formatByteCountIntoHumanReadableMemoryUnit(1024, false) -> '1 KiB'
 * ```
 * @param bytes The number of bytes that should be formatted
 * @param usebaseTen True if the unit should be reported in increments of 1000, false for 1024 (i.e. KiB vs KB)
 * @param precision The number of decimal places to use if the result is not an integer
 * @returns
 */
export function formatByteCountIntoHumanReadableMemoryUnit(
	bytes: number,
	usebaseTen: boolean = true,
	precision: number = 0
): string {
	if (bytes === 0) return '0 B';
	const baseTwoUnits = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
	const baseTenUnits = ['B', 'KB', 'MB', 'GB', 'TB'];
	const units = usebaseTen ? baseTenUnits : baseTwoUnits;
	const metricMultiplier = usebaseTen ? 1000 : 1024;
	const unitIndex = Math.min(Math.floor(Math.log(Math.abs(bytes)) / Math.log(metricMultiplier)), units.length - 1);
	const formattedValue = (bytes / Math.pow(metricMultiplier, unitIndex)).toFixed(precision);
	return `${formattedValue} ${units[unitIndex]}`;
}

export function formatFileExtensionsIntoHumanReadableList(extensions: string[]) {
	const typeFormatter = new Intl.ListFormat('en-GB', { style: 'long', type: 'disjunction' });
	return typeFormatter.format(extensions.map((word) => word.toUpperCase()));
}
