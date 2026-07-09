/**
 * This function takes a filename and replaces invalid or risky characters with an _
 * e.g. filename: cover?letter.pdf => cover_letter.pdf
 *
 * @param fileName
 * @returns
 */
export function sanitiseFileName(fileName: string): string {
	// eslint-disable-next-line no-control-regex
	return fileName.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim();
}
