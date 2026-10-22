import { ExaminationSaveController } from './examination-save-controller.ts';
import type { ManageService } from '#service';
import type { Request } from 'express';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

function createMockService(current: { planPauseStartDate: Date | null } | null = null) {
	return {
		db: {
			case: {
				findUnique: mock.fn(async (_args: unknown) => ({ id: 'someCaseId' }))
			},
			examinationInfo: {
				findUnique: mock.fn(async (_args: unknown) => current),
				upsert: mock.fn(async (_args: unknown) => ({}))
			}
		}
	};
}

const mockDate = new Date('2026-01-01T00:00:00.000Z');
mock.timers.enable({
	apis: ['Date'],
	now: mockDate
});

describe('ExaminationSaveController', () => {
	it('can save an examination', async () => {
		const mockService = createMockService();
		const req = { params: { question: 'examining-inspector-1' } } as unknown as Request;
		const answers = {};
		const expectedAnswers = {
			examiningInspectorAppointmentDate: mockDate
		};
		const expectedQuery = {
			where: { caseId: 'someCaseId' },
			update: { ...expectedAnswers },
			create: {
				caseId: 'someCaseId',
				...expectedAnswers
			}
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await examinationController.prepareAndSave(answers);
		assert.deepEqual(mockService.db.examinationInfo.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});

	const pauseDate = new Date('2026-02-01T00:00:00.000Z');
	for (const { name, current, recordHistory } of [
		{ name: 'creates history for the first pause', current: null, recordHistory: true },
		{
			name: 'does not duplicate history when the same pause date is saved',
			current: { planPauseStartDate: new Date(pauseDate) },
			recordHistory: false
		},
		{
			name: 'adds history when the pause date changes',
			current: { planPauseStartDate: mockDate },
			recordHistory: true
		}
	]) {
		it(name, async () => {
			const mockService = createMockService(current);
			const req = { params: { question: 'plan-pause-start-date' } } as unknown as Request;
			const controller = new ExaminationSaveController(mockService as unknown as ManageService, req, 'caseRef');
			const answers = { planPauseStartDate: pauseDate };
			const history = recordHistory ? { planPauseHistory: { create: { planPauseDate: pauseDate } } } : {};

			await controller.prepareAndSave(answers);

			assert.equal(mockService.db.examinationInfo.findUnique.mock.callCount(), 1);
			assert.deepEqual(mockService.db.examinationInfo.findUnique.mock.calls[0].arguments[0], {
				where: { caseId: 'someCaseId' },
				select: { planPauseStartDate: true }
			});
			assert.equal(mockService.db.examinationInfo.upsert.mock.callCount(), 1);
			assert.deepEqual(mockService.db.examinationInfo.upsert.mock.calls[0].arguments[0], {
				where: { caseId: 'someCaseId' },
				update: { ...answers, ...history },
				create: { caseId: 'someCaseId', ...answers, ...history }
			});
		});
	}
});
