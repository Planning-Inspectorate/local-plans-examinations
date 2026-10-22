import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import type { VIRUS_CHECK_STATUS_ID } from './static-data/ids/document-version.ts';

// prettier-ignore
try { loadEnvFile(path.resolve(__dirname, '../../.env')); } catch {/*ignore errors*/}

type VirusCheckStatus = (typeof VIRUS_CHECK_STATUS_ID)[keyof typeof VIRUS_CHECK_STATUS_ID];

export async function setDocumentVirusCheckStatus({
	reference,
	fileName,
	status
}: {
	reference: string;
	fileName: string;
	status: VirusCheckStatus;
}) {
	const dbClient = newDatabaseClient(loadConfig().db);

	try {
		const { count } = await dbClient.documentVersion.updateMany({
			where: { fileName, isDeleted: false, document: { isDeleted: false, case: { reference } } },
			data: { virusCheckStatus: status }
		});

		if (count === 0) {
			throw new Error(`No document "${fileName}" found for ${reference}`);
		}

		return null;
	} finally {
		await dbClient.$disconnect();
	}
}
