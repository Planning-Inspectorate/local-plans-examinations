import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { parseSqlConnectionString } from '../../packages/database/src/seed/environment-smoke-safety.ts';

export function settings(env = process.env) {
	const local = env.PERFORMANCE_LOCAL === 'true';
	const positiveInteger = (name: string, fallback: number) => {
		const value = Number(env[name] ?? fallback);
		if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
		return value;
	};
	const database = env.SQL_CONNECTION_STRING || '';
	const parsed = parseSqlConnectionString(database);
	const address = URL.parse(database.split(';')[0]);
	const servers = local ? ['localhost', '127.0.0.1'] : ['pins-sql-local-plans-primary-test.database.windows.net'];
	const databaseName = local ? 'local-plans-performance' : 'pins-sqldb-local-plans-test';
	if (
		address?.protocol !== 'sqlserver:' ||
		!servers.includes(address.hostname.toLowerCase()) ||
		!servers.includes(parsed.server) ||
		parsed.database !== databaseName ||
		(!local && !['', '1433'].includes(address.port))
	) {
		throw new Error(`Performance requires the ${databaseName} database on ${servers.join(' or ')}`);
	}
	const userId = env.CYPRESS_AUTH_USER_ID || (local ? 'performance-local-user' : '');
	if (!userId) throw new Error('CYPRESS_AUTH_USER_ID is required');
	return {
		local,
		database,
		userId,
		manageUrl: new URL(env.MANAGE_BASE_URL || 'https://local-plans-manage-test.planninginspectorate.gov.uk').origin,
		manageUsers: positiveInteger('PERFORMANCE_MANAGE_USERS', 5),
		rampSeconds: positiveInteger('PERFORMANCE_RAMP_SECONDS', 120),
		durationSeconds: positiveInteger('PERFORMANCE_DURATION_SECONDS', 600),
		requestPauseMs: positiveInteger('PERFORMANCE_REQUEST_PAUSE_MS', 10000),
		readMs: positiveInteger('PERFORMANCE_READ_MS', 2000),
		saveMs: positiveInteger('PERFORMANCE_SAVE_MS', 3000),
		minimumSamples: local ? 1 : 20,
		privateDir: resolve(env.PERFORMANCE_PRIVATE_DIR || `${tmpdir()}/local-plans-performance-${process.pid}`),
		resultsDir: resolve(env.PERFORMANCE_RESULTS_DIR || 'performance/results')
	};
}

export type Settings = ReturnType<typeof settings>;

export async function writeRunFiles(config: Settings, env = process.env) {
	const workload = {
		manageUrl: config.manageUrl,
		manageUsers: config.manageUsers,
		rampSeconds: config.rampSeconds,
		durationSeconds: config.durationSeconds,
		requestPauseMs: config.requestPauseMs,
		readMs: config.readMs,
		saveMs: config.saveMs,
		minimumSamples: config.minimumSamples
	};
	const url = new URL(config.manageUrl);
	const properties = {
		...workload,
		totalSeconds: config.rampSeconds + config.durationSeconds,
		privateDir: config.privateDir,
		scriptDir: resolve('performance/scripts'),
		manageHost: url.hostname,
		manageProtocol: url.protocol.slice(0, -1),
		managePort: url.port
	};
	await mkdir(config.resultsDir, { recursive: true });
	await writeFile(
		resolve(config.privateDir, 'jmeter.properties'),
		Object.entries(properties)
			.map(([key, value]) => `${key}=${value}`)
			.join('\n'),
		{ mode: 0o600 }
	);
	await writeFile(
		resolve(config.resultsDir, 'workload.json'),
		JSON.stringify({ ...workload, testCommit: env.BUILD_SOURCEVERSION || 'local' }, null, 2)
	);
}

if (import.meta.main) await writeRunFiles(settings());
