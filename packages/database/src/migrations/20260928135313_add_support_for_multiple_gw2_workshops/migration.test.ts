import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

describe('Gateway 2 workshop migration', () => {
	it('copies existing workshop data before removing the legacy columns', async () => {
		const migration = await readFile(new URL('./migration.sql', import.meta.url), 'utf8');
		const insertPosition = migration.indexOf('INSERT INTO [dbo].[Gateway2Workshop]');
		const dropPosition = migration.indexOf('ALTER TABLE [dbo].[Gateway2Info] DROP COLUMN');

		assert.ok(insertPosition >= 0, 'expected existing workshop data to be copied');
		assert.ok(dropPosition > insertPosition, 'expected legacy columns to be dropped after their data is copied');
		assert.match(migration, /\[workshopDate\],\s*\[workshopVenueName\][\s\S]*\[workshopDate\],\s*\[workshopVenue\]/);
	});
});
