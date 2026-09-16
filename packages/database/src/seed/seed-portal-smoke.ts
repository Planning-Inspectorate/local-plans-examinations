import { newDatabaseClient } from '../index.ts';
import { loadConfig } from '../configuration/config.ts';
import { seedStaticData } from './data-static.ts';
import { loadSeedEnv } from './load-env.ts';
import { assertEnvironmentSmokeDatabase } from './environment-smoke-safety.ts';

loadSeedEnv();

const planTitle = process.env.CYPRESS_PORTAL_SMOKE_PLAN_TITLE || 'Portal Cypress smoke';
const email = getRequiredSmokeEmail();
const maxReferenceAttempts = 20;

const lpas = [
	{ lpaCode: 'portal-smoke-council', lpaName: 'Portal Smoke Council' },
	{ lpaCode: 'portal-smoke-linked-council', lpaName: 'Portal Smoke Linked Council' }
];

async function run() {
	const config = loadConfig();
	assertEnvironmentSmokeDatabase(config.db, {
		actionName: 'Portal smoke seed'
	});
	const dbClient = newDatabaseClient(config.db);

	try {
		await seedStaticData(dbClient);

		await Promise.all(
			lpas.map((lpa) =>
				dbClient.lPA.upsert({
					where: { lpaCode: lpa.lpaCode },
					update: { lpaName: lpa.lpaName },
					create: lpa
				})
			)
		);

		const reference = await createSmokeCase(dbClient);

		console.log(
			JSON.stringify({
				currentStage: 'Gateway 2',
				dates: {
					examination: '1 September 2026',
					gateway1: '7 May 2026',
					gateway2: '21 July 2026',
					gateway3: '1 August 2026'
				},
				leadLpa: 'Portal Smoke Council',
				linkedLpa: 'Portal Smoke Linked Council',
				reference,
				status: 'Ready to start',
				title: planTitle,
				urlReference: encodeURIComponent(reference)
			})
		);
	} catch (error) {
		console.error(error);
		throw error;
	} finally {
		await dbClient.$disconnect();
	}
}

run();

async function createSmokeCase(dbClient: ReturnType<typeof newDatabaseClient>) {
	const configuredReference = process.env.CYPRESS_PORTAL_SMOKE_CASE_REFERENCE;
	const attempts = configuredReference ? [configuredReference] : createReferenceCandidates();

	for (const [index, reference] of attempts.entries()) {
		try {
			await dbClient.case.create({
				data: {
					reference,
					email,
					caseOfficer: 'portal-smoke-case-officer',
					planTitle,
					planType: 'local-plan',
					lpas: {
						connect: lpas.map(({ lpaCode }) => ({ lpaCode }))
					},
					gateway1Info: {
						create: {
							expectedGateway1Date: new Date('2026-05-07T12:00:00.000Z'),
							completedGateway1Date: new Date('2026-05-07T12:00:00.000Z')
						}
					},
					gateway2Info: {
						create: {
							expectedDate: new Date('2026-07-21T12:00:00.000Z')
						}
					},
					gateway3Info: {
						create: {
							expectedDate: new Date('2026-08-01T12:00:00.000Z')
						}
					},
					examinationInfo: {
						create: {
							expectedSubmissionForExaminationDate: new Date('2026-09-01T12:00:00.000Z')
						}
					},
					caseHistories: {
						create: {
							event: `Case created for plan ${planTitle}`,
							username: email
						}
					}
				}
			});

			return reference;
		} catch (error) {
			if (!isUniqueReferenceError(error) || configuredReference || index === attempts.length - 1) {
				throw error;
			}
		}
	}

	throw new Error('Failed to create Portal smoke case with a unique reference');
}

function getRequiredSmokeEmail() {
	const smokeEmail = process.env.CYPRESS_AUTH_USERNAME;

	if (!smokeEmail) {
		throw new Error('CYPRESS_AUTH_USERNAME is required to seed Portal smoke data');
	}

	return smokeEmail;
}

function createReferenceCandidates() {
	return Array.from({ length: maxReferenceAttempts }, createSmokeReference);
}

function createSmokeReference() {
	const suffix = Math.floor(Math.random() * 10000)
		.toString()
		.padStart(4, '0');

	return `PLAN-98${suffix}`;
}

function isUniqueReferenceError(error: unknown) {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}
