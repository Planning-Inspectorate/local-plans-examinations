import { booleanToYesNoValue } from '@planning-inspectorate/dynamic-forms';
import type { ManageService } from '#service';
import { formatDateForDisplay, parseDateInput } from '@planning-inspectorate/dynamic-forms';

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
