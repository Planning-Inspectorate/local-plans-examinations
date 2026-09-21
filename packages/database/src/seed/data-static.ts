import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';

import {
	AUTHORITY_STATUSES,
	DOCUMENT_CATEGORY,
	DOCUMENT_SET,
	DOCUMENT_SOURCE_SYSTEMS,
	DSA_CHECKED_VALUES,
	GATEWAYS,
	GATEWAY_3_DECISIONS,
	PLAN_BANDS,
	PLAN_TYPES,
	VIRUS_CHECK_STATUSES
} from './static-data/index.ts';

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
	for (const input of PLAN_TYPES) {
		await upsertReferenceData({ delegate: dbClient.planType, input });
	}

	for (const input of PLAN_BANDS) {
		await upsertReferenceData({ delegate: dbClient.planBand, input });
	}

	for (const input of DSA_CHECKED_VALUES) {
		await upsertReferenceData({ delegate: dbClient.dsaChecked, input });
	}

	for (const input of GATEWAY_3_DECISIONS) {
		await upsertReferenceData({ delegate: dbClient.gateway3Decision, input });
	}

	for (const input of AUTHORITY_STATUSES) {
		await upsertReferenceData({ delegate: dbClient.authorityStatus, input });
	}

	for (const input of DOCUMENT_SOURCE_SYSTEMS) {
		await upsertReferenceData({ delegate: dbClient.documentSourceSystem, input });
	}

	for (const input of VIRUS_CHECK_STATUSES) {
		await upsertReferenceData({ delegate: dbClient.virusCheckStatus, input });
	}

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
