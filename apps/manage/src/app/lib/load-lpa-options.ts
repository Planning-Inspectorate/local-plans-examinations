import type { ManageService } from '#service';

type LpaOption = { id: string; name: string; pinsCode: string; status: string };

export async function loadLpaOptions(service: ManageService): Promise<LpaOption[]> {
	const { db } = service;

	const authorities = await db.authority.findMany({});

	return authorities.map((authority) => ({
		id: authority.id,
		name: authority.name,
		pinsCode: authority.pinsCode,
		status: authority.status
	}));

	// try {
	// 	const raw = await readFile(jsonPath, 'utf8');
	// 	const arr = JSON.parse(raw);

	// 	if (!Array.isArray(arr)) return [];

	// 	return arr
	// 		.map((item: any) => ({
	// 			value: String(item.pinsCode || '').trim(),
	// 			text: String(item.name || '').trim()
	// 		}))
	// 		.filter((option) => option.value && option.text)
	// 		.sort((a, b) => a.text.localeCompare(b.text));
	// } catch {
	// 	return [];
	// }
}
