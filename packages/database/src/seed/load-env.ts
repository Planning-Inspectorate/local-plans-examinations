import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

const seedDirectory = path.dirname(fileURLToPath(import.meta.url));
const databaseEnvPath = path.resolve(seedDirectory, '../../.env');

export function loadSeedEnv() {
	loadOptionalEnv(databaseEnvPath);
	loadOptionalEnv();
}

function loadOptionalEnv(filePath?: string) {
	try {
		if (filePath) {
			loadEnvFile(filePath);
			return;
		}

		loadEnvFile();
	} catch {
		// Env files are optional in CI; pipeline variables can provide the same values.
	}
}
