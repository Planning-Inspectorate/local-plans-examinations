import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Settings } from './settings.ts';

type Statistic = { sampleCount: number; errorCount: number; pct2ResTime: number };
type Statistics = Record<string, Statistic>;
type Limits = Pick<Settings, 'readMs' | 'saveMs' | 'minimumSamples'>;
const actions = [
	'All cases',
	'Overview',
	'Gateway 2',
	'Gateway 3',
	'Examination',
	'Title form',
	'Save title',
	'Verify title'
];

export function evaluateResults(statistics: Statistics, limits: Limits) {
	if ([limits.readMs, limits.saveMs, limits.minimumSamples].some((value) => !Number.isInteger(value) || value < 1)) {
		return { passed: false, errors: ['Missing or invalid performance limits'] };
	}
	const errors: string[] = [];
	if (!statistics.Total?.sampleCount || statistics.Total.errorCount !== 0)
		errors.push('Missing samples or failed requests');
	for (const action of actions) {
		const label = `Manage: ${action}`;
		const sample = statistics[label];
		const limit = action === 'Save title' ? limits.saveMs : limits.readMs;
		if (!sample || sample.sampleCount < limits.minimumSamples || sample.errorCount !== 0) {
			errors.push(`${label}: missing, insufficient or failed samples`);
		}
		if (sample && (!Number.isFinite(sample.pct2ResTime) || sample.pct2ResTime > limit)) {
			errors.push(`${label}: p95 ${sample.pct2ResTime}ms exceeds ${limit}ms`);
		}
	}
	return { passed: errors.length === 0, errors };
}

if (import.meta.main) {
	const directory = process.argv[2] || process.env.PERFORMANCE_RESULTS_DIR;
	if (!directory) throw new Error('Provide a performance results directory');
	const limits = JSON.parse(await readFile(join(directory, 'workload.json'), 'utf8')) as Limits;
	const statistics = JSON.parse(await readFile(join(directory, 'html/statistics.json'), 'utf8')) as Statistics;
	const result = evaluateResults(statistics, {
		readMs: limits.readMs,
		saveMs: limits.saveMs,
		minimumSamples: limits.minimumSamples
	});
	const summary = JSON.stringify(result, null, 2);
	await writeFile(join(directory, 'summary.json'), summary);
	console.log(summary);
	process.exitCode = result.passed ? 0 : 1;
}
