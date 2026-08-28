import path from 'path';
import { loadEnvFile } from 'node:process';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { seedStaticData } from './data-static.ts';

// prettier-ignore
try { loadEnvFile(path.resolve(__dirname, '../../.env')); } catch {/* ignore errors*/}

async function run() {
	const config = loadConfig();
	// prettier-ignore
	try { loadEnvFile(); } catch {/* ignore errors*/}
	const now = new Date(Date.now());
	const dbClient = newDatabaseClient(config.db);
	const lpaCodes = ['lpa-1', 'lpa-2'];
	const lpas = [
		{
			lpaCode: 'lpa-1',
			lpaName: 'Local Planning Authority 1'
		},
		{
			lpaCode: 'lpa-2',
			lpaName: 'Local Planning Authority 2'
		}
	];
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
		await seedStaticData(dbClient);

		await dbClient.case.create({
			data: {
				reference: `PLAN-${Date.now()}`,
				email: 'cypress@test.com',
				caseOfficer: 'officer-1',
				planTitle: 'Cypress Test Plan',
				planType: 'local-plan',
				intentionToCommenceDate: now,
				gateway1Date: now,
				gateway2Date: now,
				gateway3Date: now,
				lpas: {
					connectOrCreate: lpaCodes.map((lpaCode) => ({
						where: { lpaCode },
						create: lpas.find((lpa) => lpa.lpaCode === lpaCode) || { lpaCode, lpaName: 'Unknown LPA' }
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
						expectedGateway1Date: new Date('2026-06-01T12:00:00.000Z'),
						completedGateway1Date: new Date('2026-07-01T12:00:00.000Z'),
						slaSentDate: new Date('2026-08-01T12:00:00.000Z'),
						slaReceivedDate: new Date('2026-09-01T12:00:00.000Z'),
						dsaChecked: 'yes'
					}
				},
				gateway2Info: {
					create: {
						expectedDate: new Date('2026-06-01T12:00:00.000Z'),
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
						expectedDate: new Date('2026-07-21T12:00:00.000Z'),
						actualDate: new Date('2026-08-01T12:00:00.000Z'),
						assessorName: 'assessor-1',
						assessorAppointmentDate: new Date('2026-09-01T12:00:00.000Z'),
						programmeOfficerFirstName: 'Albert',
						programmeOfficerLastName: 'Einstien',
						programmeOfficerEmail: 'gateway3.officer@test.com',
						completionDate: new Date('2026-12-01T12:00:00.000Z')
					}
				},
				examinationInfo: {
					create: {
						expectedSubmissionForExaminationDate: now,
						submissionForExaminationDate: new Date('2026-09-01T12:00:00.000Z'),
						examiningInspector1: 'inspector-1',
						examiningInspector2: 'inspector-2',
						examiningInspector3: 'inspector-3',
						examiningInspectorAppointmentDate: new Date('2026-09-01T12:00:00.000Z'),
						letterSentToMHCLGDate: new Date('2026-10-01T12:00:00.000Z'),
						letterIssueDate: new Date('2026-11-01T12:00:00.000Z'),
						factCheckDateReceivedFromInspector: new Date('2026-10-01T12:00:00.000Z'),
						factCheckDueDate: new Date('2026-11-01T12:00:00.000Z'),
						factCheckActualDate: new Date('2026-12-01T12:00:00.000Z'),
						factCheckReceivedBackFromLPADate: new Date('2026-12-02T12:00:00.000Z'),
						finalReportIssueDate: new Date('2026-12-03T12:00:00.000Z'),
						QADate: new Date('2026-12-04T12:00:00.000Z'),
						reportSentToPanelDate: new Date('2026-12-05T12:00:00.000Z'),
						panelResponseToInspectorDate: new Date('2026-12-06T12:00:00.000Z'),
						qaInspector1: 'inspector-1',
						qaInspector2: 'inspector-2',
						qaInspector3: 'inspector-3',
						planPauseStartDate: new Date('2026-12-04T12:00:00.000Z'),
						planPauseEndDate: new Date('2026-12-05T12:00:00.000Z'),
						withdrawnDate: new Date('2026-12-06T12:00:00.000Z'),
						isSound: true,
						soundUnsoundDate: new Date('2026-12-07T12:00:00.000Z'),
						adoptionDate: new Date('2026-12-08T12:00:00.000Z'),
						approvedForCILDate: new Date('2026-12-09T12:00:00.000Z')
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
