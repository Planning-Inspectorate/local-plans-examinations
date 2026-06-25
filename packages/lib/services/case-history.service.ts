import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';

export interface CreateCaseHistoryInput {
	caseId: string;
	event: string;
	date?: Date;
}

export async function createCaseHistory(dbClient: PrismaClient, input: CreateCaseHistoryInput) {
	return dbClient.caseHistory.create({
		data: {
			caseId: input.caseId,
			event: input.event
		}
	});
}
