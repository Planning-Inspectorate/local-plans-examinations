import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';

import { GATEWAYS, DOCUMENT_CATEGORY, DOCUMENT_SET } from './static-data/index.ts';

interface PrismaDelegate<T> {
	upsert: (args: { where: { id: string }; create: T; update: T }) => Promise<unknown>;
}

type ReferenceDataInput = {
	id: string;
	[key: string]: any;
};

// Static data insert / update helper
async function upsertReferenceData<T extends ReferenceDataInput>({
	delegate,
	input
}: {
	delegate: PrismaDelegate<T>;
	input: T;
}) {
	return delegate.upsert({
		create: input,
		update: input,
		where: { id: input.id }
	});
}

export async function seedStaticData(dbClient: PrismaClient) {
	for (const input of GATEWAYS) {
		await upsertReferenceData({ delegate: dbClient.gateway, input });
	}

	for (const input of DOCUMENT_CATEGORY) {
		await upsertReferenceData({ delegate: dbClient.documentCategory, input });
	}

	for (const input of DOCUMENT_SET) {
		await upsertReferenceData({ delegate: dbClient.documentSet, input });
	}

	console.log('static data seed complete');
}
