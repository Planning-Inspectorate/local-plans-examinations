// @ts-nocheck

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { STAGE, STATUS, validPlan, mockPlan, mockApplicationDoc, buildBlankApplicationDocs } from './types.ts';

const INVALID_STAGE = 999;
const INVALID_STATUS = 999;

describe('validPlan', () => {
	it('should return true for a valid plan', () => {
		const plan = mockPlan();
		assert.strictEqual(validPlan(plan), true);
	});

	it('should return false for null', () => {
		assert.strictEqual(validPlan(null), false);
	});

	it('should return false for undefined', () => {
		assert.strictEqual(validPlan(undefined), false);
	});

	it('should return false for non-objects', () => {
		assert.strictEqual(validPlan('string'), false);
		assert.strictEqual(validPlan(123), false);
	});

	it('should return false for non-string fields', () => {
		const testCases = [
			['refNum', 123],
			['leadLPA', null],
			['linkedLPA', 42],
			['title', undefined]
		];

		for (const [field, value] of testCases) {
			const plan = { ...mockPlan(), [field]: value };
			assert.strictEqual(validPlan(plan), false, `${field} must be a string`);
		}
	});

	it('should return false if stage is invalid', () => {
		const plan = { ...mockPlan(), stage: INVALID_STAGE };
		assert.strictEqual(validPlan(plan), false);
	});

	it('should return false if status is invalid', () => {
		const plan = { ...mockPlan(), status: INVALID_STATUS };
		assert.strictEqual(validPlan(plan), false);
	});

	it('should return false if dates is null', () => {
		const plan = { ...mockPlan(), dates: null };
		assert.strictEqual(validPlan(plan), false);
	});

	it('should return false if dates has invalid keys', () => {
		const plan = { ...mockPlan(), dates: { X: '1 Jan', Y: '2 Feb' } };
		assert.strictEqual(validPlan(plan), false);
	});

	it('should return false if sections has wrong length', () => {
		const plan = { ...mockPlan(), sections: [0, 0] };
		assert.strictEqual(validPlan(plan), false);
	});

	it('should return false if sections contains invalid state', () => {
		const plan = { ...mockPlan(), sections: [0, 0, INVALID_STAGE] };
		assert.strictEqual(validPlan(plan), false);
	});

	it('should return false if documents is empty', () => {
		const plan = { ...mockPlan(), documents: [] };
		assert.strictEqual(validPlan(plan), false);
	});

	it('should return false if documents contains invalid doc', () => {
		const plan = {
			...mockPlan(),
			documents: [{ title: INVALID_STAGE, type: 0, file: null, state: 0, dateCompleted: null }]
		};
		assert.strictEqual(validPlan(plan), false);
	});

	it('should return false if a document has invalid type', () => {
		const docs = buildBlankApplicationDocs();
		docs[0] = { ...docs[0], type: INVALID_STAGE } as unknown as (typeof docs)[0];
		const plan = { ...mockPlan(), documents: docs };
		assert.strictEqual(validPlan(plan), false);
	});

	it('should return false if a document has invalid state', () => {
		const docs = buildBlankApplicationDocs();
		docs[0] = { ...docs[0], state: INVALID_STAGE } as unknown as (typeof docs)[0];
		const plan = { ...mockPlan(), documents: docs };
		assert.strictEqual(validPlan(plan), false);
	});

	it('should return false if a document file is not null', () => {
		const docs = buildBlankApplicationDocs();
		docs[0] = { ...docs[0], file: 'something' } as unknown as (typeof docs)[0];
		const plan = { ...mockPlan(), documents: docs };
		assert.strictEqual(validPlan(plan), false);
	});

	it('should return true if dateCompleted is a string', () => {
		const docs = buildBlankApplicationDocs();
		docs[0] = mockApplicationDoc({ title: 0, type: 0, dateCompleted: '7 May 2026' });
		const plan = { ...mockPlan(), documents: docs };
		assert.strictEqual(validPlan(plan), true);
	});

	it('should accept all valid stage values', () => {
		for (const stage of Object.values(STAGE)) {
			const plan = { ...mockPlan(), stage };
			assert.strictEqual(validPlan(plan), true, `stage ${stage} should be valid`);
		}
	});

	it('should accept all valid status values', () => {
		for (const status of Object.values(STATUS)) {
			const plan = { ...mockPlan(), status };
			assert.strictEqual(validPlan(plan), true, `status ${status} should be valid`);
		}
	});

	it('should return false when multiple properties are invalid', () => {
		const plan = {
			...mockPlan(),
			refNum: 123 as unknown as string,
			stage: INVALID_STAGE,
			status: INVALID_STATUS,
			dates: null
		};
		assert.strictEqual(validPlan(plan), false);
	});
});
