import { describe, it } from 'node:test';
import { formatByteCountIntoHumanReadableMemoryUnit, formatFileExtensionsIntoHumanReadableList } from './file.ts';
import assert from 'node:assert';

describe('formatByteCountIntoHumanReadableMemoryUnit', () => {
	it('Can format 0 bytes', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(0), '0 B');
	});
	it('Can format single byte', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1), '1 B');
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(999), '999 B');
	});
	it('Can format a kilobyte', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1000), '1 KB');
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(999000), '999 KB');
	});
	it('Can format a megabyte', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1000000), '1 MB');
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(999000000), '999 MB');
	});
	it('Can format a gigabyte', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1000000000), '1 GB');
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(999000000000), '999 GB');
	});
	it('Can format a terabyte', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1000000000000), '1 TB');
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(999000000000000), '999 TB');
	});
	it('Can format a kibibyte', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1024, false), '1 KiB');
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1024 * 1023, false), '1023 KiB');
	});
	it('Can format a mibibyte', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1024 ** 2, false), '1 MiB');
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1024 ** 2 * 1023, false), '1023 MiB');
	});
	it('Can format a gibibyte', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1024 ** 3, false), '1 GiB');
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1024 ** 3 * 1023, false), '1023 GiB');
	});
	it('Can format a tibibyte', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1024 ** 4, false), '1 TiB');
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1024 ** 4 * 1023, false), '1023 TiB');
	});
	it('Can format decimal numbers to 1 dp for denary units', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1500, true, 1), '1.5 KB');
	});
	it('Can format decimal numbers to 2 dp for denary units', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1500, true, 2), '1.50 KB');
	});
	it('Can format decimal numbers to 1 dp for binary units', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1536, false, 1), '1.5 KiB');
	});
	it('Can format decimal numbers to 2 dp for binary units', () => {
		assert.equal(formatByteCountIntoHumanReadableMemoryUnit(1536, false, 2), '1.50 KiB');
	});
});

describe('formatFileExtensionsIntoHumanReadableList', () => {
	it('Can format an empty list', () => {
		assert.equal(formatFileExtensionsIntoHumanReadableList([]), '');
	});
	it('Can format a list with a single extension', () => {
		assert.equal(formatFileExtensionsIntoHumanReadableList(['CSV']), 'CSV');
	});
	it('Can format a list of extensions', () => {
		const extensions = ['csv', 'pdf', 'docx'];
		assert.equal(formatFileExtensionsIntoHumanReadableList(extensions), 'CSV, PDF or DOCX');
	});
});
