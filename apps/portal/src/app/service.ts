import { initGovNotify } from '@pins/local-plans-lib/govnotify/index.ts';
import type { GovNotifyClient } from '@pins/local-plans-lib/govnotify/index.ts';
import type { Config } from './config.ts';
import { STATUS, STAGE, buildPlan, validPlan } from './types.ts';
import type { Plan } from './types.ts';
import { Service } from '@pins/local-plans-lib/app/service.ts';

function formatDisplayDate(date: Date | null | undefined): string {
	if (!date) {
		return 'Not set';
	}

	return date.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

type PortalCase = {
	reference: string;
	planTitle: string;
	gateway1Date: Date | null;
	gateway2Date: Date | null;
	gateway3Date: Date | null;
	submissionDate: Date | null;
	lpas: { lpaName: string; lpaCode: string }[];
	gateway2Info: { reportIssuedDate: Date | null } | null;
	gateway3Info: { actualDate: Date | null; completionDate: Date | null } | null;
};

export function derivePlanProgress(caseRecord: PortalCase): Pick<Plan, 'stage' | 'status'> {
	if (caseRecord.gateway3Info?.completionDate || caseRecord.gateway3Info?.actualDate) {
		return {
			stage: STAGE.Examination,
			status: STATUS.ReadyToStart
		};
	}

	if (caseRecord.gateway2Info?.reportIssuedDate) {
		return {
			stage: STAGE.Gateway3,
			status: STATUS.ReadyToStart
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
	const gateway2ReportIssuedDate = caseRecord.gateway2Info?.reportIssuedDate ?? null;
	const lpaNames = caseRecord.lpas.map((lpa) => lpa.lpaName || lpa.lpaCode);
	const progress = derivePlanProgress(caseRecord);
	const plan = buildPlan({
		refNum: caseRecord.reference,
		leadLPA: lpaNames[0] ?? '',
		linkedLPA: lpaNames.slice(1).join(', '),
		title: caseRecord.planTitle,
		stage: progress.stage,
		status: progress.status,
		dates: {
			G1: formatDisplayDate(caseRecord.gateway1Date),
			G2: formatDisplayDate(gateway2ReportIssuedDate ?? caseRecord.gateway2Date),
			G3: formatDisplayDate(caseRecord.gateway3Date),
			E: formatDisplayDate(caseRecord.submissionDate)
		}
	});

	return validPlan(plan) ? plan : null;
}

const planCaseInclude = {
	gateway2Info: {
		select: {
			reportIssuedDate: true
		}
	},
	gateway3Info: {
		select: {
			actualDate: true,
			completionDate: true
		}
	},
	lpas: {
		orderBy: {
			lpaName: 'asc' as const
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
