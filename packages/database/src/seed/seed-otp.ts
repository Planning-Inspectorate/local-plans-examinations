import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import {
	PLAN_TYPE_ID,
	DOCUMENT_SET_ID,
	DOCUMENT_SOURCE_SYSTEM_ID,
	VIRUS_CHECK_STATUS_ID
} from './static-data/ids/index.ts';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const TEST_OTP = '12345';
const SALT_ROUNDS = 10;
const SECOND_TEST_EMAIL = 'test2@planninginspectorate.gov.uk';
const THIRD_TEST_EMAIL = 'test3@planninginspectorate.gov.uk';
const FOURTH_TEST_EMAIL = 'test4@planninginspectorate.gov.uk';
const CASE_REFERENCE = 'PLAN-C01';
const PLAN_TITLE = 'GW2ReportIssued';
const REPORT_ISSUED_DATE = new Date('2026-09-15T12:00:00.000Z');
const REPORT_SHARED_DATE = new Date('2026-09-15T12:00:00.000Z');
const DOCUMENT_GUID = '0c7ccb00-cc92-4913-9e70-cc77972a10ad';
const DOCUMENT_NAME = 'GW2Report.docx';
const SUBMISSION_DATE = new Date('2026-09-12T12:00:00.000Z');
const SUBMITTED_CASE_REFERENCE = 'PLAN-C02';
const SUBMITTED_PLAN_TITLE = 'GW2SubmittedNotIssued';

async function run() {
	const config = loadConfig();
	dotenv.config({ quiet: true });

	// Allow specifying a custom email via --email flag for testing Gov Notify flows
	// Without this, the script always used the default test@planninginspectorate.gov.uk
	// The --email flag lets you specify any email for seeding, which is useful for testing real Gov Notify flows with different recipients
	const emailArg = process.argv.find((arg) => arg.startsWith('--email='));
	const email = emailArg ? emailArg.split('=')[1] : 'test@planninginspectorate.gov.uk';
	const caseOnly = process.argv.includes('--case-only');
	const dbClient = newDatabaseClient(config.db);
	const lpas = [
		{ lpaCode: 'southampton', lpaName: 'Southampton City Council' },
		{ lpaCode: 'romsey', lpaName: 'Romsey Town Council' }
	];
	const lpaRelations = {
		set: lpas.map(({ lpaCode }) => ({ lpaCode }))
	};
	const planDates = {
		gateway1Date: new Date('2026-05-07T12:00:00.000Z'),
		gateway2Date: new Date('2026-07-21T12:00:00.000Z'),
		gateway3Date: new Date('2026-08-01T12:00:00.000Z'),
		submissionDate: new Date('2026-09-01T12:00:00.000Z')
	};
	const gateway1Info = {
		upsert: {
			update: {
				expectedGateway1Date: planDates.gateway1Date,
				completedGateway1Date: planDates.gateway1Date
			},
			create: {
				expectedGateway1Date: planDates.gateway1Date,
				completedGateway1Date: planDates.gateway1Date
			}
		}
	};
	const gateway2Info = {
		upsert: {
			update: {
				expectedDate: planDates.gateway2Date,
				actualDate: null,
				reportIssuedDate: null
			},
			create: {
				expectedDate: planDates.gateway2Date,
				actualDate: null,
				reportIssuedDate: null
			}
		}
	};
	const gateway2InfoReportIssued = {
		upsert: {
			update: {
				expectedDate: planDates.gateway2Date,
				actualDate: SUBMISSION_DATE,
				reportIssuedDate: REPORT_ISSUED_DATE
			},
			create: {
				expectedDate: planDates.gateway2Date,
				actualDate: SUBMISSION_DATE,
				reportIssuedDate: REPORT_ISSUED_DATE
			}
		}
	};
	const gateway2InfoSubmitted = {
		upsert: {
			update: {
				expectedDate: planDates.gateway2Date,
				actualDate: SUBMISSION_DATE,
				reportIssuedDate: null
			},
			create: {
				expectedDate: planDates.gateway2Date,
				actualDate: SUBMISSION_DATE,
				reportIssuedDate: null
			}
		}
	};
	const gateway3Info = {
		upsert: {
			update: {
				expectedDate: planDates.gateway3Date,
				actualDate: null
			},
			create: {
				expectedDate: planDates.gateway3Date,
				actualDate: null,
				submissions: {
					// Will always have at least one entry
					createMany: {
						data: [
							{
								decision: undefined,
								completionDate: undefined
							}
						]
					}
				}
			}
		}
	};
	const examinationInfo = {
		upsert: {
			update: {
				expectedSubmissionForExaminationDate: planDates.submissionDate
			},
			create: {
				expectedSubmissionForExaminationDate: planDates.submissionDate
			}
		}
	};

	// Upserts a case sharing the data dates/LPAs/gateway info above
	// Test relies on createdAt to test cases are ordered correctly
	function upsertCase({
		reference,
		caseEmail,
		planTitle,
		createdAt,
		submissionDate = null,
		gateway2InfoUpsert = gateway2Info
	}: {
		reference: string;
		caseEmail: string;
		planTitle: string;
		createdAt?: Date;
		submissionDate?: Date | null;
		gateway2InfoUpsert?: typeof gateway2Info | typeof gateway2InfoReportIssued | typeof gateway2InfoSubmitted;
	}) {
		return dbClient.case.upsert({
			where: { reference },
			update: {
				email: caseEmail,
				caseOfficer: 'Test Officer',
				planTitle,
				planType: PLAN_TYPE_ID.LOCAL_PLAN,
				...planDates,
				submissionDate,
				...(createdAt ? { createdAt } : {}),
				lpas: lpaRelations,
				gateway1Info,
				gateway2Info: gateway2InfoUpsert,
				gateway3Info,
				examinationInfo
			},
			create: {
				reference,
				email: caseEmail,
				caseOfficer: 'Test Officer',
				planTitle,
				planType: PLAN_TYPE_ID.LOCAL_PLAN,
				...planDates,
				submissionDate,
				...(createdAt ? { createdAt } : {}),
				gateway1Info: {
					create: gateway1Info.upsert.create
				},
				gateway2Info: {
					create: gateway2InfoUpsert.upsert.create
				},
				gateway3Info: {
					create: gateway3Info.upsert.create
				},
				examinationInfo: {
					create: examinationInfo.upsert.create
				},
				lpas: {
					connect: lpaRelations.set
				}
			}
		});
	}

	async function upsertOtp(otpEmail: string) {
		const hashedOtp = await bcrypt.hash(TEST_OTP, SALT_ROUNDS);
		const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

		await dbClient.oneTimePassword.upsert({
			where: { email: otpEmail },
			update: { hashedOtp, expiresAt, attempts: 0, lockedOutUntil: null },
			create: { email: otpEmail, hashedOtp, expiresAt }
		});
	}

	try {
		await Promise.all(
			lpas.map((lpa) =>
				dbClient.lPA.upsert({
					where: { lpaCode: lpa.lpaCode },
					update: { lpaName: lpa.lpaName },
					create: lpa
				})
			)
		);

		// Case for primary test email
		await upsertCase({ reference: 'PLAN-001', caseEmail: email, planTitle: 'East Borough Local Plan' });

		// Second case for the same user, date is before today so ordering on the My plans page
		await upsertCase({
			reference: 'PLAN-002',
			caseEmail: email,
			planTitle: 'West Local Plan',
			createdAt: new Date('2026-01-01T09:00:00.000Z')
		});

		// Case for a second user, to prove one user's plans never appear for another user.
		await upsertCase({
			reference: 'PLAN-B01',
			caseEmail: SECOND_TEST_EMAIL,
			planTitle: 'User B Local Plan'
		});

		// Case for fourth user, GW2 submitted in the FO but no report issued yet in the BO
		await upsertCase({
			reference: SUBMITTED_CASE_REFERENCE,
			caseEmail: FOURTH_TEST_EMAIL,
			planTitle: SUBMITTED_PLAN_TITLE,
			submissionDate: SUBMISSION_DATE,
			gateway2InfoUpsert: gateway2InfoSubmitted
		});

		// Case for third user, submitted GW2 in the FO and GW2 report issued in BO
		const reportIssuedCase = await upsertCase({
			reference: CASE_REFERENCE,
			caseEmail: THIRD_TEST_EMAIL,
			planTitle: PLAN_TITLE,
			submissionDate: SUBMISSION_DATE,
			gateway2InfoUpsert: gateway2InfoReportIssued
		});

		await dbClient.document.upsert({
			where: { guid: DOCUMENT_GUID },
			update: {},
			create: {
				guid: DOCUMENT_GUID,
				name: DOCUMENT_NAME,
				caseId: reportIssuedCase.id,
				documentSetId: DOCUMENT_SET_ID.G2_REPORT,
				versions: {
					create: {
						version: 1,
						originalFilename: DOCUMENT_NAME,
						fileName: DOCUMENT_NAME,
						sourceSystem: DOCUMENT_SOURCE_SYSTEM_ID.BACK_OFFICE,
						virusCheckStatus: VIRUS_CHECK_STATUS_ID.SCANNED,
						dateCreated: REPORT_SHARED_DATE
					}
				}
			}
		});
		await dbClient.document.update({
			where: { guid: DOCUMENT_GUID },
			data: { latestVersionId: 1 }
		});

		if (!caseOnly) {
			// Seed the same known OTP for both test emails so either can log in during a test
			await upsertOtp(email);
			await upsertOtp(SECOND_TEST_EMAIL);

			console.log(JSON.stringify({ otp: TEST_OTP }));
		}
	} catch (error) {
		console.error(error);
		throw error;
	} finally {
		await dbClient.$disconnect();
	}
}

run();
