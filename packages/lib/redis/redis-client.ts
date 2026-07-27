import { createCluster, type RedisClusterType } from 'redis';
import { RedisStore } from 'connect-redis';
import { MSALCacheClient } from './msal-cache-client.ts';
import { PartitionManager } from './partition-manager.ts';
import { DistributedCachePlugin } from '@azure/msal-node';
import { EntraIdCredentialsProviderFactory, REDIS_SCOPE_DEFAULT } from '@redis/entraid';
import { getDefaultAzureCredential } from '@azure/identity';
import type { Logger } from 'pino';
import type { IPartitionManager } from '@azure/msal-node';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export class RedisClient {
	private readonly prefix: string;
	private readonly logger: Logger;
	private readonly client: RedisClusterType;
	readonly store: RedisStore;
	readonly get: (key: string) => Promise<null | string>;
	readonly set: (key: string, value: string) => void;
	private readonly clientWrapper: MSALCacheClient;

	/**
     @param url - Redis URL e.g. `rediss://my-redis:123` (see https://github.com/redis/node-redis/blob/master/docs/client-configuration.md#createclient-configuration)
     @param logger
     @param prefix - prefix to use for shared instances
   **/
	constructor(url: string, logger: Logger, prefix?: string) {
		this.prefix = prefix + 'sess:';
		this.logger = logger;

		// configure Entra auth
		const credential = getDefaultAzureCredential();
		const provider = EntraIdCredentialsProviderFactory.createForDefaultAzureCredential({
			credential,
			scopes: REDIS_SCOPE_DEFAULT,
			tokenManagerConfig: {
				expirationRefreshRatio: 0.8
			}
		});

		this.client = createCluster({
			rootNodes: [{ url }],
			defaults: {
				credentialsProvider: provider,
				// send a ping every 5 minutes to prevent idle timeout (10mins in Azure)
				// https://learn.microsoft.com/en-us/azure/redis/best-practices-connection#idle-timeout
				pingInterval: FIVE_MINUTES_MS,
				socket: {
					tls: true,
					rejectUnauthorized: false
				}
			}
		});

		// register events for info - the 'error' event must be subscribed to, to avoid Node exiting, handled below
		for (const event of RedisEvents) {
			this.client.on(event, buildLogEvent(logger, event));
		}

		const onError = (error: Error, node?: RedisNode) => {
			const fields: { error: Error; node?: RedisNode } = { error };
			if (node) {
				fields.node = node;
			}
			logger.error(fields, `Redis cluster error: ${error?.message}`);
		};
		this.client.on('error', onError);
		this.client.on('node-error', onError);

		// kick off the connection - no await here, in the background
		this.client.connect().catch(onError);

		this.store = new RedisStore({
			client: this.client,
			prefix: this.prefix
		});

		this.get = this.client.get;
		this.set = this.client.set;

		this.clientWrapper = new MSALCacheClient(this.client);
	}

	makeCachePlugin(sessionId: string): DistributedCachePlugin {
		const partitionManager = new PartitionManager(this.clientWrapper, sessionId, this.logger, this.prefix);
		return new DistributedCachePlugin(this.clientWrapper, partitionManager as IPartitionManager);
	}
}

const RedisEvents = Object.freeze([
	'connect',
	'disconnect',
	'node-ready',
	'node-connect',
	'node-reconnecting',
	'node-disconnect'
]);

function buildLogEvent(logger: Logger, event: string) {
	return (node?: RedisNode) => {
		const fields: { node?: RedisNode } = {};
		if (node) {
			fields.node = node;
		}
		logger.info(fields, `Redis cluster: ${event}`);
	};
}

interface RedisNode {
	host: string;
	port: number;
}
