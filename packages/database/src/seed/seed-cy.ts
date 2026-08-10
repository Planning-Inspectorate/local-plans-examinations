import path from 'path';
import { loadEnvFile } from 'node:process';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';

// prettier-ignore
try { loadEnvFile(path.resolve(__dirname, '../../.env')); } catch {/* ignore errors*/}

async function run() {
	const config = loadConfig();
	// prettier-ignore
	try { loadEnvFile(); } catch {/* ignore errors*/}
	const now = new Date(Date.now());
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
				caseOfficer: 'officer-1',
				planTitle: 'Cypress Test Plan',
				planType: 'local-plan',
				intentionToCommenceDate: now,
				gateway1Date: now,
				gateway2Date: now,
				gateway3Date: now,
				submissionDate: now,
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
				},
				gateway1Info: {
					create: {
						noticeOfIntention: new Date('2026-05-01T12:00:00.000Z'),
						estimatedGateway1Date: new Date('2026-06-01T12:00:00.000Z'),
						completedGateway1Date: new Date('2026-07-01T12:00:00.000Z'),
						slaSentDate: new Date('2026-08-01T12:00:00.000Z'),
						slaReceivedDate: new Date('2026-09-01T12:00:00.000Z'),
						dsaChecked: 'yes'
					}
				},
				gateway2Info: {
					create: {
						estimatedDate: new Date('2026-06-01T12:00:00.000Z'),
						actualDate: new Date('2026-07-01T12:00:00.000Z'),
						validDate: new Date('2026-08-01T12:00:00.000Z'),
						assessorAppointmentDate: new Date('2026-09-01T12:00:00.000Z'),
						workshopDate: new Date('2026-09-01T12:00:00.000Z'),
						reportIssuedDate: new Date('2026-09-01T12:00:00.000Z'),
						reportPublishedByLPA: new Date('2026-09-01T12:00:00.000Z'),
						assessorName: 'assessor-1',
						workshopVenue: 'Workshop venue name'
					}
				},
				gateway3Info: {
					create: {
						estimatedDate: now
					}
				},
				examinationInfo: {
					create: {
						submissionForExaminationDate: now,
						letterSentToMHCLGDate: new Date('2026-10-01T12:00:00.000Z'),
						letterIssueDate: new Date('2026-11-01T12:00:00.000Z')
					}
				},
				caseHistories: {
					create: {
						event: `Case created for plan Cypress Test Plan`,
						username: 'unknown'
					}
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
