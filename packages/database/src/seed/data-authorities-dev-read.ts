import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { AUTHORITY_STATUS_ID } from './static-data/ids/authority-status.ts';

const __dirname = import.meta.dirname;

const HEADERS: Readonly<{ [x: string]: string }> = {
	AUTHORITY_NAME: 'pinsName',
	PINS_LPA_CODE: 'pinsCode',
	STATUS: 'status'
};

/**
 * Reads the CSV file specified by the LPA_DATA_FILE_PATH environment variable, parses it, and writes a JSON file with the same data in a format suitable for seeding the database.
 * The CSV file is expected to have three columns: pinsName, pinsCode, and status. The first row is treated as headers.
 * The output JSON file will be written to the same directory as this script, with the name 'data-authorities-dev-list.json'.
 */
async function run(): Promise<void> {
	const LPA_DATA_FILE_PATH = process.env.LPA_DATA_FILE_PATH;
	if (!LPA_DATA_FILE_PATH) {
		throw new Error('LPA_DATA_FILE_PATH is required');
	}
	const contents = await readFile(LPA_DATA_FILE_PATH, 'utf8');
	const lines = contents
		.toString()
		.split('\n')
		.filter(Boolean)
		.map((l) => l.trim())
		.map(parseCSVLine);

	const headers = lines[0];
	if (headers.length !== 3) {
		throw new Error('Expected 3 columns');
	}
	const allMatch = lines.every((line) => line.length === headers.length);
	if (!allMatch) {
		throw new Error('Not all lines have the same number of columns');
	}

	const createInputs = lines
		.slice(1)
		.map((l) => mapToObject(headers, l))
		.map(toCreateInput);

	// quick data integrity check - codes may not be unique, but should always have the same name
	const pinsCodeToName = new Map();
	for (const authority of createInputs) {
		if (authority.pinsCode) {
			if (pinsCodeToName.has(authority.pinsCode)) {
				const name = pinsCodeToName.get(authority.pinsCode);
				if (name !== authority.name) {
					throw new Error(
						`Duplicate pinsCode with different names, code: ${authority.pinsCode}, names: ${name}, ${authority.name}`
					);
				}
			}
			pinsCodeToName.set(authority.pinsCode, authority.name);
		}
	}

	await writeFile(
		path.join(__dirname, 'data-authorities-dev-list.json'),
		JSON.stringify(createInputs, null, 2),
		'utf8'
	);
	console.log(`data-authorities-dev-list.json written with ${createInputs.length} LPAs`);
}

/**
 * Convert a record representing an LPA to a format suitable for creating an Authority in the database. The record is expected to have keys corresponding to the headers defined in the HEADERS constant.
 */
function toCreateInput(lpa: Record<string, string>) {
	if (!Object.values(AUTHORITY_STATUS_ID).includes(lpa[HEADERS.STATUS])) {
		console.warn(
			`Unknown status '${lpa[HEADERS.STATUS]}' for authority '${lpa[HEADERS.AUTHORITY_NAME]}', setting to 'UNKNOWN'`
		);
	}

	return {
		id: lpa[HEADERS.PINS_LPA_CODE],
		name: lpa[HEADERS.AUTHORITY_NAME],
		pinsCode: lpa[HEADERS.PINS_LPA_CODE],
		statusId: Object.values(AUTHORITY_STATUS_ID).includes(lpa[HEADERS.STATUS])
			? lpa[HEADERS.STATUS]
			: AUTHORITY_STATUS_ID.UNKNOWN
	};
}

function mapToObject(headers: string[], line: string[]): Record<string, string> {
	const obj: Record<string, string> = {};
	headers.forEach((header, i) => {
		obj[header] = line[i];
	});
	return obj;
}

/**
 * Parse one line of a CSV file, handling quoted fields and escaped quotes
 */
function parseCSVLine(line: string): string[] {
	const result = [];
	let field = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				field += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			result.push(field);
			field = '';
		} else {
			field += char;
		}
	}
	result.push(field);
	return result;
}

run().catch(console.error);
