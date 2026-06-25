import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const TEST_OTP = 'CYPRESSTEST';
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

	try {
		// Ensure case record exists for the test email
		await dbClient.case.upsert({
			where: { reference: 'LP-TEST-001' },
			update: { email },
			create: {
				reference: 'LP-TEST-001',
				email,
				caseOfficer: 'Test Officer',
				planTitle: 'Test Local Plan',
				planType: 'Local Plan'
			}
		});

		// Always reset OTP lockout to prevent lockout from previous test runs
		const existingOtp = await dbClient.oneTimePassword.findUnique({ where: { email } });
		if (existingOtp) {
			await dbClient.oneTimePassword.update({
				where: { email },
				data: { attempts: 0, locked_out_until: null }
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
