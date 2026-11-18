import type { ManageService } from '#service';
import type { Request } from 'express';
import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { SaveController } from './save-controller.ts';
import type { SaveInput } from './save-inputs.ts';

class MockSaveController extends SaveController {
	protected async prepareData(answers: Record<string, any>) {
		return this.trimStringValues(answers);
	}

	public saveToDatabase = mock.fn(async (_answers: SaveInput) => true);

	public shouldSaveToSession = mock.fn(async () => true);

	public fireNotifications = mock.fn(async (_answers: SaveInput) => {});

	public resolveCaseIdProxy() {
		return this.resolveCaseId();
	}

	public saveToSessionProxy(answers: SaveInput) {
		return this.saveToSession(answers);
	}
}

function createController(caseRecord: { id: string } | null = { id: 'someCaseId' }) {
	const findUnique = mock.fn(async () => caseRecord);
	const service = { db: { case: { findUnique } } };
	const req = { session: {} } as Request;
	const controller = new MockSaveController(service as unknown as ManageService, req, 'someRef');

	return { controller, req };
}

describe('SaveController', () => {
	it('rejects when no case can be found for the reference', async () => {
		const { controller } = createController(null);

		await assert.rejects(controller.resolveCaseIdProxy(), {
			message: 'Case not found for reference "someRef"'
		});
	});

	it('can save answers to the session', () => {
		const { controller, req } = createController();
		const answers = { someField: 'a', anotherField: 'b' };

		assert.strictEqual(controller.saveToSessionProxy(answers), true);
		assert.deepStrictEqual(req.session.answers, answers);
	});

	it('fires notifications with the prepared answers after a successful database save', async () => {
		const { controller, req } = createController();
		controller.shouldSaveToSession.mock.mockImplementationOnce(async () => false);

		const events: string[] = [];
		controller.saveToDatabase.mock.mockImplementationOnce(async () => {
			await Promise.resolve();
			events.push('database save completed');
			return true;
		});
		controller.fireNotifications.mock.mockImplementationOnce(async () => {
			await Promise.resolve();
			events.push('notifications completed');
		});

		const result = await controller.prepareAndSave({ someField: '  a  ' });
		const preparedAnswers = { someField: 'a' };

		assert.deepStrictEqual(result, { dataWritten: true, writtenToDB: true });
		assert.strictEqual(controller.saveToDatabase.mock.callCount(), 1);
		assert.deepStrictEqual(controller.saveToDatabase.mock.calls[0].arguments, [preparedAnswers]);
		assert.strictEqual(controller.fireNotifications.mock.callCount(), 1);
		assert.deepStrictEqual(controller.fireNotifications.mock.calls[0].arguments, [preparedAnswers]);
		assert.deepStrictEqual(events, ['database save completed', 'notifications completed']);
		assert.strictEqual(req.session.answers, undefined);
	});

	it('skips notifications when the database save returns false', async () => {
		const { controller } = createController();
		controller.shouldSaveToSession.mock.mockImplementationOnce(async () => false);
		controller.saveToDatabase.mock.mockImplementationOnce(async () => false);

		const result = await controller.prepareAndSave({ someField: 'a' });

		assert.deepStrictEqual(result, { dataWritten: false, writtenToDB: true });
		assert.strictEqual(controller.saveToDatabase.mock.callCount(), 1);
		assert.strictEqual(controller.fireNotifications.mock.callCount(), 0);
	});

	it('saves prepared answers to the session and skips the database and notifications', async () => {
		const { controller, req } = createController();

		const result = await controller.prepareAndSave({ someField: '  a  ' });

		assert.deepStrictEqual(result, { dataWritten: true, writtenToDB: false });
		assert.deepStrictEqual(req.session.answers, { someField: 'a' });
		assert.strictEqual(controller.saveToDatabase.mock.callCount(), 0);
		assert.strictEqual(controller.fireNotifications.mock.callCount(), 0);
	});
});
