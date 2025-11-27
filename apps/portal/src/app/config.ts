import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import type { BaseConfig } from '@pins/local-plans-lib/app/config-types.d.ts';
import { APP_CONSTANTS } from './constants.ts';

export type Config = BaseConfig;

// Cached to avoid repeated environment parsing
let config: Config | undefined;

// Validates required environment variables and provides defaults
export function loadConfig(): Config {
	if (config) {
		return config;
	}
	// load configuration from .env file into process.env
	dotenv.config();

	// get values from the environment
	const {
		CACHE_CONTROL_MAX_AGE,
		GIT_SHA,
		LOG_LEVEL,
		PORT,
		NODE_ENV,
		REDIS_CONNECTION_STRING,
		SESSION_SECRET,
		SQL_CONNECTION_STRING
	} = process.env;

	const buildConfig = loadBuildConfig();

	if (!SESSION_SECRET) {
		throw new Error('SESSION_SECRET is required');
	}

	let httpPort = APP_CONSTANTS.DEFAULTS.HTTP_PORT;
	if (PORT) {
		const port = parseInt(PORT);
		if (isNaN(port)) {
			throw new Error('PORT must be an integer');
		}
		httpPort = port;
	}

	config = {
		cacheControl: {
			maxAge: CACHE_CONTROL_MAX_AGE || APP_CONSTANTS.DEFAULTS.CACHE_MAX_AGE
		},
		database: {
			connectionString: SQL_CONNECTION_STRING
		},
		gitSha: GIT_SHA,
		// the log level to use
		logLevel: LOG_LEVEL || APP_CONSTANTS.DEFAULTS.LOG_LEVEL,
		NODE_ENV: NODE_ENV || APP_CONSTANTS.DEFAULTS.NODE_ENV,
		// the HTTP port to listen on
		httpPort: httpPort,
		// the src directory
		srcDir: buildConfig.srcDir,
		session: {
			redisPrefix: 'portal:',
			redis: REDIS_CONNECTION_STRING,
			secret: SESSION_SECRET
		},
		// the static directory to serve assets from (images, css, etc..)
		staticDir: buildConfig.staticDir
	};

	return config;
}

export interface BuildConfig {
	srcDir: string;
	staticDir: string;
}

// Calculates paths relative to current file for runtime and build scripts
export function loadBuildConfig(): BuildConfig {
	// Get the directory path of the current file
	const dirname = path.dirname(fileURLToPath(import.meta.url));
	// Calculate the src directory (parent of app directory)
	const srcDir = path.join(dirname, '..');
	// Calculate the static assets directory
	const staticDir = path.join(srcDir, '.static');

	return {
		srcDir,
		staticDir
	};
}
