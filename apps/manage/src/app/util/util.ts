import { booleanToYesNoValue } from '@planning-inspectorate/dynamic-forms';
import type { ManageService } from '#service';
import { formatDateForDisplay, parseDateInput } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
import type { AuthSession } from '#util/cached-entra-client.ts';

export function formatValue(value: any) {
	if (typeof value === 'boolean') {
		return booleanToYesNoValue(value);
	}
	return value;
}

export async function checkSoundUnsoundManuallySet(service: ManageService, caseId: string): Promise<boolean> {
	const { db } = service;

	const dateUpdatedCaseHistory = await db.caseHistory.findFirst({
		where: {
			caseId,
			OR: [
				{ event: { startsWith: 'Report issued updated' } },
				{ event: { startsWith: 'Sound / unsound date updated' } }
			]
		},
		select: { id: true }
	});

	return dateUpdatedCaseHistory !== null;
}

export function formatDateAnswer(value: Date | 'string', format: string): string {
	if (!value) return 'Not provided';
	if (value instanceof Date) return formatDateForDisplay(value, { format: format });
	if (typeof value === 'string' && value.includes('/')) {
		const [day, month, year] = value.split('/').map(Number);
		if (!day || !month || !year) return '';
		return formatDateForDisplay(parseDateInput({ day, month, year }), { format: format });
	}
	return formatDateForDisplay(value as string, { format: format });
}

type InspectorName = { firstName?: string | null; lastName?: string | null };

export async function getExaminingInspectorNames(
	service: ManageService,
	reference: string,
	req: Request & { session: AuthSession }
): Promise<InspectorName[]> {
	const entraClient = service.getEntraClient(req.session);
	if (!entraClient) return [];

	const caseRecord = await service.db.case.findUnique({
		where: { reference },
		select: {
			examinationInfo: {
				select: { examiningInspector1: true, examiningInspector2: true, examiningInspector3: true }
			}
		}
	});
	const info = caseRecord?.examinationInfo;
	const ids = [info?.examiningInspector1, info?.examiningInspector2, info?.examiningInspector3].filter(
		(id): id is string => Boolean(id)
	);

	return Promise.all(
		ids.map(async (id) => {
			const { givenName, surname } = await entraClient.getUserName(id);
			return { firstName: givenName, lastName: surname };
		})
	);
}
