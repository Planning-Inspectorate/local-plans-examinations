import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { seedCase } from './data-case.ts';
import { loadEnvFile } from 'node:process';
import path from 'path';
// prettier-ignore
try { loadEnvFile(path.resolve(__dirname, '../../.env')); } catch {/* ignore errors*/}

async function run() {
	const config = loadConfig();
	const dbClient = newDatabaseClient(config.db);

	try {
		await seedCase(dbClient, {
			reference: `PLAN-${Math.floor(Math.random() * 1000000)}`,
			email: 'jane.doe@example.gov.uk',
			caseOfficer: 'Sam Officer',
			planTitle: 'Example Local Plan',
			planType: 'Local Plan',
			lpas: [{ lpaCode: 'E60000001', lpaName: 'Example Council' }],
			contacts: [
				{
					firstName: 'Jane',
					lastName: 'Doe',
					email: 'jane.doe@example.gov.uk',
					phone: '01234567890',
					lpaContact: 'E60000001'
				}
			],
			intentionToCommenceDate: '01/01/2026',
			gateway1Date: '01/03/2026',
			gateway2Date: '01/06/2026',
			gateway3Date: '01/09/2026',
			expectedSubmissionForExaminationDate: '01/12/2026'
		});
	} catch (error) {
		console.error(error);
		throw error;
	} finally {
		await dbClient.$disconnect();
	}
}

run();
