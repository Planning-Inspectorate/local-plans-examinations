import { booleanToYesNoValue } from '@planning-inspectorate/dynamic-forms';
import type { ManageService } from '#service';

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
