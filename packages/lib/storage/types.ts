import type { Request } from 'express';
import type { Readable } from 'node:stream';

export type FileStorageProvider = 'blob' | 'sharepoint';

export type UploadedFile = {
	id: string;
	fileName: string;
	mimeType: string;
	size: number;
	storageProvider: FileStorageProvider;
	containerName?: string;
	path?: string;
	url?: string;
	dateCreated?: Date;
	/** The latest virus/malware scan status for the file, e.g. 'not_scanned', 'scanned' or 'affected'. */
	virusCheckStatus?: string;
	metadata?: Record<string, unknown>;
};

export type UploadedRequestFile = {
	originalname: string;
	mimetype: string;
	size: number;
	buffer?: Buffer;
	stream?: Readable;
};

export type FileUploadDestination = {
	folderPath?: string;
	fileName?: string;
	metadata?: Record<string, unknown>;
};

export type FileUploadStorageAdapter = {
	provider: FileStorageProvider;
	upload(file: UploadedRequestFile, destination?: FileUploadDestination): Promise<UploadedFile>;
	delete?(file: UploadedFile): Promise<void>;
	list?(destination?: FileUploadDestination): Promise<UploadedFile[]>;
};

export type FileUploadStorageAdapterFactory = (
	req: Request
) => FileUploadStorageAdapter | Promise<FileUploadStorageAdapter>;
