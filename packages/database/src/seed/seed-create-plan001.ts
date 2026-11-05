import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { loadSeedEnv } from './load-env.ts';
import bcrypt from 'bcrypt';

loadSeedEnv();

async function main() {
	const config = loadConfig();
	const db = newDatabaseClient(config.db);

	const hashedOtp = await bcrypt.hash('12345', 10);
	const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
	await db.oneTimePassword.upsert({
		where: { email: 'test@planninginspectorate.gov.uk' },
		update: { hashedOtp, expiresAt, attempts: 0, lockedOutUntil: null },
		create: { email: 'test@planninginspectorate.gov.uk', hashedOtp, expiresAt }
	});

	await db.case.upsert({
		where: { reference: 'PLAN-001' },
		update: {},
		create: {
			reference: 'PLAN-001',
			email: 'test@planninginspectorate.gov.uk',
			caseOfficer: 'Test Officer',
			planTitle: 'East Borough Local Plan',
			planType: 'local-plan',
			gateway3Info: {
				create: {
					expectedDate: new Date('2026-08-01'),
					actualDate: new Date('2026-10-01'),
					submissions: {
						createMany: { data: [{ completionDate: undefined, decision: undefined }] }
					}
				}
			}
		}
	});

	console.log('PLAN-001 and OTP created (OTP: 12345)');
	await db.$disconnect();
}

main();
