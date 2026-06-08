import path from 'path';
import dotenv from 'dotenv';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
	const config = loadConfig();
	dotenv.config({ quiet: true });

	const dbClient = newDatabaseClient(config.db);
	const lpaCodes = ['lpa-1', 'lpa-2'];
	const contactDetails = [
		{
			firstName: 'Jane',
			lastName: 'Smith',
			email: 'jane@lpa.gov.uk',
			phone: '01234567890',
			lpaContact: 'lpa-1'
		},
		{
			firstName: 'Bob',
			lastName: 'Johnson',
			email: 'bob@lpa.gov.uk',
			lpaContact: 'lpa-2'
		}
	];
	try {
		await dbClient.case.create({
			data: {
				reference: `PLAN/${Date.now()}`,
				email: 'cypress@test.com',
				caseOfficer: 'Terry Test',
				planTitle: 'Cypress Test Plan',
				planType: 'Local Plan',
				intentionToCommenceDate: new Date(Date.now()),
				gateway1Date: new Date(Date.now()),
				gateway2Date: new Date(Date.now()),
				gateway3Date: new Date(Date.now()),
				submissionDate: new Date(Date.now()),
				lpas: {
					connectOrCreate: lpaCodes.map((lpaCode) => ({
						where: { lpaCode },
						create: { lpaCode }
					}))
				},
				contacts: {
					create: contactDetails.map((contact) => ({
						firstName: contact.firstName,
						lastName: contact.lastName,
						email: contact.email,
						phoneNumber: contact.phone || '',
						lpaCode: contact.lpaContact
					}))
				}
			}
		});
	} catch (error) {
		console.error(error);
		throw error;
	} finally {
		await dbClient.$disconnect();
	}
}

run();
