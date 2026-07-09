import type { Request } from 'express';
import type { Readable } from 'node:stream';

export type FileStorageProvider = 'blob' | 'sharepoint';

export type UploadedFile = {
	id: string;
	fileName: string;
	mimeType: string;
	size: number;
	storageProvider: FileStorageProvider;
	path?: string;
	url?: string;
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
