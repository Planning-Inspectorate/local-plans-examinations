import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PrismaAdapter } from './prisma-adapter.ts';
import { mockLogger } from '../testing/mock-logger.ts';

describe('PrismaAdapter', () => {
	let mockClient: any;
	let mockTable: any;
	let adapter: PrismaAdapter;
	let logger: any;

	beforeEach(() => {
		logger = mockLogger();
		mockTable = {
			create: () => Promise.resolve({ id: 'test-id', createdAt: new Date() }),
			count: () => Promise.resolve(5),
			findUnique: () => Promise.resolve({ id: 'test-id', name: 'test' }),
			findMany: () => Promise.resolve([{ id: 'test-id', name: 'test' }]),
			findFirst: () => Promise.resolve({ id: 'test-id', name: 'test' }),
			update: () => Promise.resolve({ id: 'test-id', updatedAt: new Date() }),
			updateMany: () => Promise.resolve({ count: 2 }),
			deleteMany: () => Promise.resolve({ count: 1 }),
			createMany: () => Promise.resolve({ count: 3 }),
			upsert: () => Promise.resolve({ id: 'test-id', name: 'test' })
		};
		mockClient = { testTable: mockTable };
		adapter = new PrismaAdapter(mockClient, 'testTable', logger);
	});

	describe('existing methods', () => {
		it('should create record', async () => {
			const result = await adapter.create({ name: 'test' });
			assert.strictEqual(result.id, 'test-id');
		});

		it('should count records', async () => {
			const result = await adapter.count();
			assert.strictEqual(result, 5);
		});

		it('should find by id', async () => {
			const result = await adapter.findById!('test-id');
			assert.strictEqual(result?.id, 'test-id');
		});

		it('should find many records', async () => {
			const result = await adapter.findMany!();
			assert.strictEqual(result.length, 1);
		});
	});

	describe('new methods', () => {
		it('should find first record', async () => {
			const result = await adapter.findFirst!({ name: 'test' });
			assert.strictEqual(result?.id, 'test-id');
		});

		it('should update many records', async () => {
			const result = await adapter.updateMany!({ active: true }, { status: 'updated' });
			assert.strictEqual(result.count, 2);
		});

		it('should delete many records', async () => {
			const result = await adapter.deleteMany!({ active: false });
			assert.strictEqual(result.count, 1);
		});

		it('should create many records', async () => {
			const result = await adapter.createMany!([{ name: 'test1' }, { name: 'test2' }]);
			assert.strictEqual(result.count, 3);
		});

		it('should upsert record', async () => {
			const result = await adapter.upsert!({ id: 'test-id' }, { name: 'new' }, { name: 'updated' });
			assert.strictEqual(result.id, 'test-id');
		});

		it('should check if record exists', async () => {
			mockTable.findFirst = () => Promise.resolve({ id: 'test-id' });
			const result = await adapter.exists!({ name: 'test' });
			assert.strictEqual(result, true);
		});

		it('should return false if record does not exist', async () => {
			mockTable.findFirst = () => Promise.resolve(null);
			const result = await adapter.exists!({ name: 'nonexistent' });
			assert.strictEqual(result, false);
		});
	});
});
