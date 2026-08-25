import type { ManageService } from '#service';

type LpaOption = { value: string; text: string };

export async function loadLpaOptions(service: ManageService): Promise<LpaOption[]> {
	const { db } = service;

	if (service.authDisabled) {
		return [
			{
				value: 'lpa-1',
				text: 'Local Planning Authority 1'
			},
			{
				value: 'lpa-2',
				text: 'Local Planning Authority 2'
			},
			{
				value: 'lpa-3',
				text: 'Local Planning Authority 3'
			}
		];
	}

	const authorities = await db.authority.findMany({});

	return authorities.map((authority) => ({
		value: authority.pinsCode,
		text: authority.name
	}));
}
