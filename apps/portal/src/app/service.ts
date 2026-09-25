import { initGovNotify } from '@pins/local-plans-lib/govnotify/index.ts';
import type { GovNotifyClient } from '@pins/local-plans-lib/govnotify/index.ts';
import type { Config } from './config.ts';
import { STATUS, STAGE, buildPlan, validPlan } from './types.ts';
import type { Plan } from './types.ts';
import { Service } from '@pins/local-plans-lib/app/service.ts';
import { formatDisplayDate } from '#util/date.ts';
import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

type PortalCase = {
	reference: string;
	planTitle: string;
	lpas: { lpaName: string; lpaCode: string }[];
	gateway1Info: {
		expectedGateway1Date: Date | null;
		completedGateway1Date: Date | null;
	} | null;
	gateway2Info: {
		expectedDate: Date | null;
		actualDate: Date | null;
		reportIssuedDate: Date | null;
	} | null;
	gateway3Info: {
		expectedDate: Date | null;
		actualDate: Date | null;
		submissions: {
			completionDate: Date | null;
		}[];
	} | null;
	examinationInfo: {
		expectedSubmissionForExaminationDate: Date | null;
		submissionForExaminationDate: Date | null;
	} | null;
	documents: {
		guid: string;
		name: string;
		createdAt: Date;
		latestDocumentVersion: {
			originalFilename: string | null;
			fileName: string | null;
			dateCreated: Date | null;
			isDeleted: boolean;
		} | null;
	}[];
};

function getGateway2ReportUploadedDate(caseRecord: PortalCase): Date | null {
	const uploadedReport = caseRecord.documents.find(
		(document) => document.latestDocumentVersion && !document.latestDocumentVersion.isDeleted
	);
	return uploadedReport?.latestDocumentVersion?.dateCreated ?? uploadedReport?.createdAt ?? null;
}

function hasIssuedGateway2Report(caseRecord: PortalCase): boolean {
	return Boolean(caseRecord.gateway2Info?.reportIssuedDate && getGateway2ReportUploadedDate(caseRecord));
}

function getGateway2ReportFiles(caseRecord: PortalCase): Plan['gateway2ReportFiles'] {
	if (!caseRecord.gateway2Info?.reportIssuedDate) {
		return [];
	}

	return caseRecord.documents.flatMap((document) => {
		const version = document.latestDocumentVersion;
		if (!version || version.isDeleted) {
			return [];
		}

		return [
			{
				fileName: version.originalFilename ?? version.fileName ?? document.name,
				documentGuid: document.guid,
				...(version.dateCreated ? { dateCreated: version.dateCreated } : {})
			}
		];
	});
}

export function derivePlanProgress(caseRecord: PortalCase): Pick<Plan, 'stage' | 'status'> {
	if (caseRecord.gateway3Info?.submissions.at(-1)?.completionDate || caseRecord.gateway3Info?.actualDate) {
		return {
			stage: STAGE.Examination,
			status: STATUS.ReadyToStart
		};
	}

	if (hasIssuedGateway2Report(caseRecord)) {
		return {
			stage: STAGE.Gateway3,
			status: STATUS.ReadyToStart
		};
	}

	if (caseRecord.gateway2Info?.actualDate) {
		return {
			stage: STAGE.Gateway2,
			status: STATUS.UnderReview
		};
	}

	return {
		stage: STAGE.Gateway2,
		status: STATUS.ReadyToStart
	};
}

// Converts a database Case record into the Plan shape used by the portal views.
// This keeps display formatting, LPA naming, and stage/status derivation in one place.
function mapCaseToPlan(caseRecord: PortalCase): Plan | null {
	const lpaNames = caseRecord.lpas.map((lpa) => lpa.lpaName || lpa.lpaCode);
	const progress = derivePlanProgress(caseRecord);
	const gateway1Date = caseRecord.gateway1Info?.completedGateway1Date ?? caseRecord.gateway1Info?.expectedGateway1Date;
	const gateway2Date = hasIssuedGateway2Report(caseRecord)
		? caseRecord.gateway2Info?.reportIssuedDate
		: (caseRecord.gateway2Info?.actualDate ?? caseRecord.gateway2Info?.expectedDate);
	const gateway3Date =
		caseRecord.gateway3Info?.submissions[-1]?.completionDate ??
		caseRecord.gateway3Info?.actualDate ??
		caseRecord.gateway3Info?.expectedDate;
	const examinationDate =
		caseRecord.examinationInfo?.submissionForExaminationDate ??
		caseRecord.examinationInfo?.expectedSubmissionForExaminationDate;
	const plan = buildPlan({
		refNum: caseRecord.reference,
		leadLPA: lpaNames[0] ?? '',
		linkedLPA: lpaNames.slice(1).join(', '),
		title: caseRecord.planTitle,
		stage: progress.stage,
		status: progress.status,
		gateway2ReportFiles: getGateway2ReportFiles(caseRecord),
		dates: {
			G1: formatDisplayDate(gateway1Date) ?? 'Not set',
			G2: formatDisplayDate(gateway2Date) ?? 'Not set',
			G3: formatDisplayDate(gateway3Date) ?? 'Not set',
			E: formatDisplayDate(examinationDate) ?? 'Not set'
		}
	});

	return validPlan(plan) ? plan : null;
}

const planCaseInclude = {
	gateway1Info: {
		select: {
			expectedGateway1Date: true,
			completedGateway1Date: true
		}
	},
	gateway2Info: {
		select: {
			expectedDate: true,
			actualDate: true,
			reportIssuedDate: true
		}
	},
	gateway3Info: {
		select: {
			expectedDate: true,
			actualDate: true,
			submissions: true
		}
	},
	examinationInfo: {
		select: {
			expectedSubmissionForExaminationDate: true,
			submissionForExaminationDate: true
		}
	},
	lpas: {
		orderBy: {
			lpaName: 'asc' as const
		}
	},
	documents: {
		where: {
			documentSetId: DOCUMENT_SET_ID.G2_REPORT,
			isDeleted: false
		},
		orderBy: {
			createdAt: 'asc' as const
		},
		select: {
			guid: true,
			name: true,
			createdAt: true,
			latestDocumentVersion: {
				select: {
					originalFilename: true,
					fileName: true,
					dateCreated: true,
					isDeleted: true
				}
			}
		}
	}
};

export class PortalService extends Service {
	readonly clarityId: string | undefined;
	readonly auth: Config['auth'];
	readonly environment: Config['environment'];
	readonly notifyClient: GovNotifyClient | null;

	constructor(config: Config) {
		super(config);
		this.auth = config.auth;
		this.environment = config.environment;
		this.clarityId = config.clarityId;
		this.notifyClient = initGovNotify(config.govNotify, this.logger);
	}

	override get otherSessionOptions() {
		return { name: 'portal' };
	}

	async getPlans(email?: string): Promise<Plan[]> {
		const caseRecords = (await this.db.case.findMany({
			where: {
				deletedDate: null,
				...(email ? { email } : {})
			},
			include: planCaseInclude,
			orderBy: {
				createdAt: 'desc'
			}
		} as Parameters<typeof this.db.case.findMany>[0])) as unknown as PortalCase[];

		return caseRecords.map(mapCaseToPlan).filter((plan): plan is Plan => Boolean(plan));
	}
}
