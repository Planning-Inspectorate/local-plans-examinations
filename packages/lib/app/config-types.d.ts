import type { BaseConfig } from '@planning-inspectorate/core/app';

export interface ConfigWithBlob extends BaseConfig {
	blobStorage: {
		containerName: string;
		connectionString?: string;
		accountUrl?: string;
	};
}
