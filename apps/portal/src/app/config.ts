import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import type { BaseConfig } from '@pins/local-plans-lib/app/config-types.d.ts';
import { APP_CONSTANTS } from './constants.ts';

/**
 * Portal application configuration type extending base configuration
 *
 * @typedef {BaseConfig} Config
 */
export type Config = BaseConfig;

/** Cached configuration instance to avoid repeated environment parsing */
let config: Config | undefined;

/**
 * Loads and validates configuration from environment variables
 *
 * Parses .env file and validates required environment variables,
 * providing sensible defaults from APP_CONSTANTS where appropriate.
 *
 * @returns {Config} Complete application configuration object
 * @throws {Error} When required environment variables are missing or invalid
 *
 * @example
 * ```typescript
 * const config = loadConfig();
 * console.log(`Server will run on port ${config.httpPort}`);
 * ```
 */
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

/**
 * Build-time configuration interface for file paths
 *
 * @interface BuildConfig
 * @property {string} srcDir - Absolute path to the source directory
 * @property {string} staticDir - Absolute path to the static assets directory
 */
export interface BuildConfig {
	srcDir: string;
	staticDir: string;
}

/**
 * Loads build configuration with computed file paths
 *
 * Calculates source and static directory paths relative to the current file location.
 * Used by both runtime configuration and build scripts.
 *
 * @returns {BuildConfig} Build configuration with resolved directory paths
 *
 * @example
 * ```typescript
 * const buildConfig = loadBuildConfig();
 * console.log(`Static files served from: ${buildConfig.staticDir}`);
 * ```
 */
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
