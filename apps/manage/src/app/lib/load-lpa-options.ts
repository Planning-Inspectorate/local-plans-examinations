import { readFile } from 'fs/promises';
import path from 'path';

type LpaOption = { value: string; text: string };

export async function loadLpaOptions(): Promise<LpaOption[]> {
	const jsonPath = process.env.LPA_DATA_JSON_PATH || path.join(process.cwd(), 'data-authorities-prod-list.json');

	try {
		const raw = await readFile(jsonPath, 'utf8');
		const arr = JSON.parse(raw);

		if (!Array.isArray(arr)) return [];

		return arr
			.map((item: any) => ({
				value: String(item.pinsCode || '').trim(),
				text: String(item.name || '').trim()
			}))
			.filter((option) => option.value && option.text)
			.sort((a, b) => a.text.localeCompare(b.text));
	} catch {
		return [];
	}
}
