import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const TEST_OTP = '12345';
const SALT_ROUNDS = 10;
const SECOND_TEST_EMAIL = 'test2@planninginspectorate.gov.uk';

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
	const gateway2Info = {
		upsert: {
			update: {
				reportIssuedDate: null
			},
			create: {
				reportIssuedDate: null
			}
		}
	};
	const gateway3Info = {
		upsert: {
			update: {
				actualDate: null,
				completionDate: null
			},
			create: {
				actualDate: null,
				completionDate: null
			}
		}
	};

	// Upserts a case sharing the data dates/LPAs/gateway info above
	// Test relies on createdAt to test cases are ordered correctly
	function upsertCase({
		reference,
		caseEmail,
		planTitle,
		createdAt
	}: {
		reference: string;
		caseEmail: string;
		planTitle: string;
		createdAt?: Date;
	}) {
		return dbClient.case.upsert({
			where: { reference },
			update: {
				email: caseEmail,
				caseOfficer: 'Test Officer',
				planTitle,
				planType: 'Local Plan',
				...planDates,
				...(createdAt ? { createdAt } : {}),
				lpas: lpaRelations,
				gateway2Info,
				gateway3Info
			},
			create: {
				reference,
				email: caseEmail,
				caseOfficer: 'Test Officer',
				planTitle,
				planType: 'Local Plan',
				...planDates,
				...(createdAt ? { createdAt } : {}),
				gateway2Info: {
					create: gateway2Info.upsert.create
				},
				gateway3Info: {
					create: gateway3Info.upsert.create
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
