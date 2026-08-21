import type { ManageService } from '#service';

type LpaOption = { value: string; text: string };

export async function loadLpaOptions(service: ManageService): Promise<LpaOption[]> {
	const { db } = service;

	const authorities = await db.authority.findMany({});

	return authorities.map((authority) => ({
		value: authority.pinsCode,
		text: authority.name
	}));
}
