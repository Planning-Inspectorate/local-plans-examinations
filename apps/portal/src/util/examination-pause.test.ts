import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import { getActiveExaminationPause, getEffectiveExaminationStatus } from './examination-pause.ts';

const now = new Date('2026-11-17T12:00:00.000Z');

describe('examination pause', () => {
	it('returns the latest pause while it has no restart date', () => {
		const activePause = {
			createdAt: new Date('2026-11-15T12:00:00.000Z'),
			planPauseDate: new Date('2026-11-15T00:00:00.000Z'),
			planPauseEndDate: null
		};

		assert.equal(getActiveExaminationPause([activePause], now), activePause);
		assert.equal(
			getEffectiveExaminationStatus(EXAMINATION_STATUS_ID.IN_EXAMINATION, [activePause], now),
			EXAMINATION_STATUS_ID.PAUSED
		);
	});

	it('keeps a plan paused until its future restart date', () => {
		const activePause = {
			planPauseDate: new Date('2026-11-15T00:00:00.000Z'),
			planPauseEndDate: new Date('2026-11-20T00:00:00.000Z')
		};

		assert.equal(getActiveExaminationPause([activePause], now), activePause);
	});

	it('restores the persisted pre-pause status once the restart date has elapsed', () => {
		const elapsedPause = {
			planPauseDate: new Date('2026-11-15T00:00:00.000Z'),
			planPauseEndDate: new Date('2026-11-17T00:00:00.000Z')
		};

		assert.equal(getActiveExaminationPause([elapsedPause], now), null);
		assert.equal(
			getEffectiveExaminationStatus(EXAMINATION_STATUS_ID.IN_EXAMINATION, [elapsedPause], now),
			EXAMINATION_STATUS_ID.IN_EXAMINATION
		);
	});

	it('does not pause a plan before the pause start date', () => {
		const futurePause = {
			planPauseDate: new Date('2026-11-18T00:00:00.000Z'),
			planPauseEndDate: null
		};

		assert.equal(getActiveExaminationPause([futurePause], now), null);
	});

	it('uses the most recently created pause', () => {
		const oldOpenPause = {
			createdAt: new Date('2026-11-01T12:00:00.000Z'),
			planPauseDate: new Date('2026-11-01T00:00:00.000Z'),
			planPauseEndDate: null
		};
		const latestElapsedPause = {
			createdAt: new Date('2026-11-10T12:00:00.000Z'),
			planPauseDate: new Date('2026-11-10T00:00:00.000Z'),
			planPauseEndDate: new Date('2026-11-12T00:00:00.000Z')
		};

		assert.equal(getActiveExaminationPause([oldOpenPause, latestElapsedPause], now), null);
	});
});
