import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const TEST_OTP = '12345';
const SALT_ROUNDS = 10;

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

		// Ensure case record exists for the test email
		await dbClient.case.upsert({
			where: { reference: 'PLAN-001' },
			update: {
				email,
				caseOfficer: 'Test Officer',
				planTitle: 'East Borough Local Plan',
				planType: 'Local Plan',
				...planDates,
				lpas: lpaRelations,
				gateway2Info,
				gateway3Info
			},
			create: {
				reference: 'PLAN-001',
				email,
				caseOfficer: 'Test Officer',
				planTitle: 'East Borough Local Plan',
				planType: 'Local Plan',
				...planDates,
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

		// Always reset OTP lockout to prevent lockout from previous test runs
		const existingOtp = await dbClient.oneTimePassword.findUnique({ where: { email } });
		if (existingOtp) {
			await dbClient.oneTimePassword.update({
				where: { email },
				data: { attempts: 0, lockedOutUntil: null }
			});
		}

		if (!caseOnly) {
			// Seed OTP
			const hashedOtp = await bcrypt.hash(TEST_OTP, SALT_ROUNDS);
			const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

			await dbClient.oneTimePassword.update({
				where: { email },
				data: { hashedOtp, expiresAt }
			});

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
