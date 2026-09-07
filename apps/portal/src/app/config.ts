import { loadEnvFile } from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'url';
import type { BaseConfig } from '@pins/local-plans-lib/app/config-types.d.ts';

export type Config = BaseConfig & {
	environment: string;
	auth: {
		otpBypassCode: string;
	};
	govNotify: {
		disabled: boolean;
		apiKey: string;
		templateIds: {
			authCode: string;
		};
	};
	// Microsoft Clarity tracking id (optional, set via CLARITY_ID)
	clarityId?: string;
};

// cache the config
let config: Config | undefined;

/**
 * Load configuration from the environment
 */
export function loadConfig(): Config {
	if (config) {
		return config;
	}
	// load configuration from .env file into process.env
	// prettier-ignore
	try { loadEnvFile(); } catch {/* ignore errors*/}

	// get values from the environment
	const {
		CACHE_CONTROL_MAX_AGE,
		GIT_SHA,
		LOG_LEVEL,
		PORT,
		MANAGED_REDIS_URL,
		NODE_ENV,
		SESSION_SECRET,
		SQL_CONNECTION_STRING,
		GOV_NOTIFY_DISABLED,
		GOV_NOTIFY_API_KEY,
		GOV_NOTIFY_AUTH_CODE_TEMPLATE_ID,
		BLOB_STORE_CONTAINER,
		BLOB_STORE_CONNECTION_STRING,
		BLOB_STORE_ACCOUNT_URL,
		CLARITY_ID,
		ENVIRONMENT,
		OTP_BYPASS_CODE
	} = process.env;

	const buildConfig = loadBuildConfig();
	const blobStoreAccountUrl = BLOB_STORE_ACCOUNT_URL || undefined;
	const shouldUseDevelopmentStorage = !blobStoreAccountUrl && NODE_ENV !== 'production';

	if (!SESSION_SECRET) {
		throw new Error('SESSION_SECRET is required');
	}

	const notifyDisabled = GOV_NOTIFY_DISABLED === 'true';
	if (!notifyDisabled) {
		if (!GOV_NOTIFY_API_KEY) throw new Error('GOV_NOTIFY_API_KEY must be a non-empty string');
		if (!GOV_NOTIFY_AUTH_CODE_TEMPLATE_ID)
			throw new Error('GOV_NOTIFY_AUTH_CODE_TEMPLATE_ID must be a non-empty string');
	}

	let httpPort = 8080;
	if (PORT) {
		const port = parseInt(PORT);
		if (isNaN(port)) {
			throw new Error('PORT must be an integer');
		}
		httpPort = port;
	}

	config = {
		// the cache control max age for static assets
		cacheControl: {
			maxAge: CACHE_CONTROL_MAX_AGE || '1d'
		},
		// the database connection string
		database: {
			connectionString: SQL_CONNECTION_STRING
		},
		environment: ENVIRONMENT || 'local',
		auth: {
			otpBypassCode: OTP_BYPASS_CODE || ''
		},
		// the git sha of the current build
		gitSha: GIT_SHA,
		// the log level to use
		logLevel: LOG_LEVEL || 'info',
		// the node environment to use
		NODE_ENV: NODE_ENV || 'development',
		// the HTTP port to listen on
		httpPort: httpPort,
		// the src directory
		srcDir: buildConfig.srcDir,
		// the session configuration
		session: {
			redisPrefix: 'portal:',
			redis: MANAGED_REDIS_URL,
			secret: SESSION_SECRET
		},
		// the static directory to serve assets from (images, css, etc..)
		staticDir: buildConfig.staticDir,
		// blob storage configuration for storing uploaded files
		blobStorage: {
			containerName: BLOB_STORE_CONTAINER || 'uploads',
			connectionString:
				BLOB_STORE_CONNECTION_STRING || (shouldUseDevelopmentStorage ? 'UseDevelopmentStorage=true' : undefined),
			accountUrl: blobStoreAccountUrl
		},
		// Gov Notify configuration for sending emails
		govNotify: {
			disabled: notifyDisabled,
			apiKey: GOV_NOTIFY_API_KEY || '',
			templateIds: {
				authCode: GOV_NOTIFY_AUTH_CODE_TEMPLATE_ID || ''
			}
		},
		// Microsoft Clarity id for analytics tracking (optional)
		clarityId: CLARITY_ID || undefined
	};

	return config;
}

export interface BuildConfig {
	srcDir: string;
	staticDir: string;
}

/**
 * Config required for the build script
 */
export function loadBuildConfig(): BuildConfig {
	// get the file path for the directory this file is in
	const dirname = path.dirname(fileURLToPath(import.meta.url));
	// get the file path for the src directory
	const srcDir = path.join(dirname, '..');
	// get the file path for the .static directory
	const staticDir = path.join(srcDir, '.static');

	return {
		srcDir,
		staticDir
	};
}
