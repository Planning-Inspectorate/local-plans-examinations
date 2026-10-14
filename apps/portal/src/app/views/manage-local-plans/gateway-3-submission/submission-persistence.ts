import type { PortalService } from '#service';
import { randomUUID } from 'node:crypto';
import { GW3_FILE_UPLOAD_QUESTIONS } from './questions.ts';
import { sortGateway3Submissions, type Gateway3SubmissionSummary } from '#util/gateway-3-submission.ts';

type TransactionClient = Omit<
	PortalService['db'],
	'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

type Gateway3UploadedDocumentCandidate = {
	guid: string;
	name: string;
	documentSetId: string;
	latestDocumentVersion: {
		version: number;
		lastModified: Date | null;
		sourceSystem: string;
		virusCheckStatus: string;
		originalFilename: string | null;
		fileName: string | null;
		owner: string | null;
		mime: string | null;
		size: number | null;
		blobStorageContainer: string | null;
		blobStoragePath: string | null;
		documentURI: string | null;
		dateCreated: Date | null;
		isDeleted: boolean;
	} | null;
};

type Gateway3SubmittedDocument = {
	documentGuid: string;
	documentVersion: NonNullable<Gateway3UploadedDocumentCandidate['latestDocumentVersion']>;
};

type Gateway3CaseForSubmission = {
	id: string;
	gateway3Info: {
		id: string;
		submissions?: Gateway3SubmissionSummary[] | null;
	} | null;
	documents: Gateway3UploadedDocumentCandidate[];
};

const gateway3LpaDocumentSetFolderNames = Object.values(GW3_FILE_UPLOAD_QUESTIONS).map((q) => q.url);
async function getGateway3LpaDocumentSetIds(tx: TransactionClient): Promise<string[]> {
	const documentSets = await tx.documentSet.findMany({
		where: {
			folderName: {
				in: gateway3LpaDocumentSetFolderNames
			}
		},
		select: {
			id: true,
			folderName: true
		}
	});
	const documentSetIdsByFolderName = new Map(
		documentSets.map((documentSet) => [documentSet.folderName, documentSet.id])
	);

	for (const folderName of gateway3LpaDocumentSetFolderNames) {
		if (!documentSetIdsByFolderName.has(folderName)) {
			throw new Error(`Missing document set reference data for "${folderName}". Run the database static seed.`);
		}
	}

	return [...documentSetIdsByFolderName.values()];
}

async function getGateway3ManageDocumentSetId(tx: TransactionClient, submissionNumber: number): Promise<string> {
	const folderName = `gateway-3-document-${submissionNumber}`;
	const documentSet = await tx.documentSet.findFirst({
		where: {
			folderName
		},
		select: {
			id: true
		}
	});

	if (!documentSet) {
		throw new Error(`Missing document set reference data for "${folderName}". Run the database static seed.`);
	}

	return documentSet.id;
}

function getCurrentGateway3SubmissionNumber(gateway3Info: Gateway3CaseForSubmission['gateway3Info']): number {
	const submissions = sortGateway3Submissions(gateway3Info?.submissions ?? []);
	return Math.max(submissions.length, 1);
}

function getSubmittedGateway3Documents(caseRecord: Gateway3CaseForSubmission): Gateway3SubmittedDocument[] {
	return caseRecord.documents.flatMap((document) => {
		if (document.name.startsWith('gateway-3-submission-')) {
			return [];
		}

		const version = document.latestDocumentVersion;
		if (!version || version.isDeleted) {
			return [];
		}

		return [
			{
				documentGuid: document.guid,
				documentVersion: version
			}
		];
	});
}

async function mirrorGateway3DocumentsForManage(
	tx: TransactionClient,
	caseId: string,
	submissionNumber: number,
	submissionDate: Date,
	documents: Gateway3SubmittedDocument[]
) {
	const documentSetId = await getGateway3ManageDocumentSetId(tx, submissionNumber);
	const existingDocumentNames = new Set(
		(
			await tx.document.findMany({
				where: {
					caseId,
					documentSetId
				},
				select: {
					name: true
				}
			})
		).map((document) => document.name)
	);

	for (const document of documents) {
		if (existingDocumentNames.has(document.documentGuid)) {
			continue;
		}

		const mirroredDocumentGuid = randomUUID();
		await tx.document.create({
			data: {
				guid: mirroredDocumentGuid,
				name: document.documentGuid,
				caseId,
				documentSetId,
				createdAt: submissionDate
			}
		});

		await tx.documentVersion.create({
			data: {
				documentGuid: mirroredDocumentGuid,
				version: 1,
				lastModified: document.documentVersion.lastModified,
				sourceSystem: document.documentVersion.sourceSystem,
				virusCheckStatus: document.documentVersion.virusCheckStatus,
				originalFilename: document.documentVersion.originalFilename,
				fileName: document.documentVersion.fileName,
				owner: document.documentVersion.owner,
				mime: document.documentVersion.mime,
				size: document.documentVersion.size,
				blobStorageContainer: document.documentVersion.blobStorageContainer,
				blobStoragePath: document.documentVersion.blobStoragePath,
				documentURI: document.documentVersion.documentURI,
				dateCreated: document.documentVersion.dateCreated
			}
		});

		await tx.document.update({
			where: {
				guid: mirroredDocumentGuid
			},
			data: {
				// Mirrored Manage documents are created once per final submission and always start at version 1.
				// Existing mirrors are skipped above by source document GUID.
				latestVersionId: 1
			}
		});
	}
}

export async function recordGateway3PortalSubmission(
	service: PortalService,
	caseId: string,
	submissionDate: Date
): Promise<void> {
	await service.db.$transaction(async (tx) => {
		const documentSetIds = await getGateway3LpaDocumentSetIds(tx);
		const caseRecord = (await tx.case.findUnique({
			where: {
				id: caseId
			},
			select: {
				id: true,
				gateway3Info: {
					select: {
						id: true,
						submissions: {
							select: {
								decision: true,
								completionDate: true
							}
						}
					}
				},
				documents: {
					where: {
						documentSetId: {
							in: documentSetIds
						},
						isDeleted: false
					},
					select: {
						guid: true,
						name: true,
						documentSetId: true,
						latestDocumentVersion: {
							select: {
								version: true,
								lastModified: true,
								sourceSystem: true,
								virusCheckStatus: true,
								originalFilename: true,
								fileName: true,
								owner: true,
								mime: true,
								size: true,
								blobStorageContainer: true,
								blobStoragePath: true,
								documentURI: true,
								dateCreated: true,
								isDeleted: true
							}
						}
					}
				}
			}
		})) as Gateway3CaseForSubmission | null;

		if (!caseRecord?.gateway3Info) {
			throw new Error(`No Gateway 3 info found for case ${caseId}`);
		}

		const submissionNumber = getCurrentGateway3SubmissionNumber(caseRecord.gateway3Info);
		const submittedDocuments = getSubmittedGateway3Documents(caseRecord);

		if (submittedDocuments.length === 0) {
			throw new Error(`No active Gateway 3 documents found for case ${caseId}`);
		}

		await mirrorGateway3DocumentsForManage(tx, caseRecord.id, submissionNumber, submissionDate, submittedDocuments);

		await tx.case.update({
			where: {
				id: caseRecord.id
			},
			data: {
				submissionDate
			}
		});

		await tx.gateway3Info.update({
			where: {
				id: caseRecord.gateway3Info.id
			},
			data: {
				actualDate: submissionDate
			}
		});
	});
}
