import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';

type ExaminationWebsiteSources = {
	/** ExaminationInfo row: `examinationWebsiteUrl` is saved by the Portal examination submission, `examinationWebsite` by Manage */
	examinationInfo?: { examinationWebsite?: string | null; examinationWebsiteUrl?: string | null } | null;
	/** Gateway3Info row: `examinationWebsiteUrl` is saved by the Portal Gateway 3 submission */
	gateway3Info?: { examinationWebsiteUrl?: string | null } | null;
};

type ExaminationWebsiteDatabase = Pick<PrismaClient, 'examinationInfo' | 'gateway3Info'>;

export function resolveExaminationWebsite({ examinationInfo, gateway3Info }: ExaminationWebsiteSources): string | null {
	const candidates = [
		examinationInfo?.examinationWebsiteUrl,
		gateway3Info?.examinationWebsiteUrl,
		examinationInfo?.examinationWebsite
	];
	for (const candidate of candidates) {
		if (typeof candidate === 'string' && candidate.trim().length > 0) {
			return candidate.trim();
		}
	}
	return null;
}

export async function syncPortalExaminationWebsite(
	db: ExaminationWebsiteDatabase,
	caseId: string,
	website: string | undefined
) {
	if (typeof website !== 'string' || website.trim().length === 0) {
		return;
	}
	const examinationWebsiteUrl = website.trim();
	const submittedInPortal = { caseId, examinationWebsiteUrl: { not: null } };
	await db.examinationInfo.updateMany({ where: submittedInPortal, data: { examinationWebsiteUrl } });
	await db.gateway3Info.updateMany({ where: submittedInPortal, data: { examinationWebsiteUrl } });
}
