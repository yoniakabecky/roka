import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportCsv } from '$lib/csv-studio/export-csv';

// Minimal rows fixture
const rows = [
	{ name: 'Alice', age: '30', city: 'Tokyo' },
	{ name: 'Bob', age: '25', city: 'Osaka' }
];

const allColumns = ['name', 'age', 'city'];
const identityRename = Object.fromEntries(allColumns.map((c) => [c, c]));

// Capture the last blob passed to URL.createObjectURL so tests can inspect it
let lastBlob: Blob | null = null;
let lastAnchor: { href: string; download: string; clicked: boolean; click: ReturnType<typeof vi.fn> } | null = null;

beforeEach(() => {
	lastBlob = null;
	lastAnchor = null;
	vi.restoreAllMocks();

	// In Node there is no `window`; point it at globalThis so the source-level
	// `window.showSaveFilePicker` access works, and stubGlobal calls below are
	// visible on the same object.
	vi.stubGlobal('window', globalThis);

	vi.stubGlobal('URL', {
		createObjectURL: vi.fn((blob: Blob) => {
			lastBlob = blob;
			return 'blob:mock-url';
		}),
		revokeObjectURL: vi.fn()
	});

	const anchor = { href: '', download: '', clicked: false, click: vi.fn() };
	vi.stubGlobal('document', { createElement: vi.fn().mockReturnValue(anchor) });
	lastAnchor = anchor;

	// Remove the File System Access API by default; individual tests can override
	vi.stubGlobal('showSaveFilePicker', undefined);
});

// ---------------------------------------------------------------------------
// Helper: parse a CSV string back into { fields, data }
// ---------------------------------------------------------------------------
const parseCsv = (csv: string) => {
	const lines = csv.trim().split(/\r?\n/);
	const fields = lines[0].split(',');
	const data = lines.slice(1).map((line) =>
		Object.fromEntries(line.split(',').map((v, i) => [fields[i], v]))
	);
	return { fields, data };
};

const getBlobText = async (blob: Blob) => blob.text();

// ---------------------------------------------------------------------------

describe('exportCsv — column handling', () => {
	it('uses renamed headers in the CSV output', async () => {
		const rename = { name: 'Full Name', age: 'Age', city: 'City' };
		await exportCsv(rows, allColumns, rename, 'test');

		const text = await getBlobText(lastBlob!);
		const { fields } = parseCsv(text);
		expect(fields).toEqual(['Full Name', 'Age', 'City']);
	});

	it('falls back to original column name when rename is identity', async () => {
		await exportCsv(rows, allColumns, identityRename, 'test');

		const text = await getBlobText(lastBlob!);
		const { fields } = parseCsv(text);
		expect(fields).toEqual(['name', 'age', 'city']);
	});

	it('falls back to original name when column is absent from colRename', async () => {
		// colRename[c] is undefined → ?? c uses the original column name
		const partialRename = { name: 'Full Name' } as Record<string, string>;
		await exportCsv(rows, allColumns, partialRename, 'test');

		const text = await getBlobText(lastBlob!);
		const { fields, data } = parseCsv(text);
		expect(fields).toEqual(['Full Name', 'age', 'city']);
		expect(data[0]['age']).toBe('30');
	});

	it('excludes hidden columns (not in visibleColumns)', async () => {
		await exportCsv(rows, ['name', 'city'], identityRename, 'test');

		const text = await getBlobText(lastBlob!);
		const { fields } = parseCsv(text);
		expect(fields).not.toContain('age');
		expect(fields).toEqual(['name', 'city']);
	});

	it('projects row values to renamed keys', async () => {
		const rename = { name: 'Full Name', age: 'age', city: 'city' };
		await exportCsv(rows, ['name', 'age'], rename, 'test');

		const text = await getBlobText(lastBlob!);
		const { data } = parseCsv(text);
		expect(data[0]['Full Name']).toBe('Alice');
		expect(data[1]['Full Name']).toBe('Bob');
	});

	it('defaults missing cell values to empty string', async () => {
		const sparse = [{ name: 'Alice' }] as Record<string, string>[];
		await exportCsv(sparse, allColumns, identityRename, 'test');

		const text = await getBlobText(lastBlob!);
		const { data } = parseCsv(text);
		expect(data[0]['age']).toBe('');
		expect(data[0]['city']).toBe('');
	});

	it('produces header-only CSV when rows is empty', async () => {
		await exportCsv([], allColumns, identityRename, 'test');

		const text = await getBlobText(lastBlob!);
		const { fields, data } = parseCsv(text);
		expect(fields).toEqual(['name', 'age', 'city']);
		expect(data).toEqual([]);
	});

	it('produces empty CSV when visibleColumns is empty', async () => {
		await exportCsv(rows, [], identityRename, 'test');

		const text = await getBlobText(lastBlob!);
		expect(text.trim()).toBe('');
	});
});

describe('exportCsv — suggested filename', () => {
	it('appends .csv to the stem for the fallback download', async () => {
		await exportCsv(rows, allColumns, identityRename, 'my-export');
		expect(lastAnchor!.download).toBe('my-export.csv');
	});
});

describe('exportCsv — fallback download path (no File System Access API)', () => {
	it('calls URL.createObjectURL with a CSV blob', async () => {
		await exportCsv(rows, allColumns, identityRename, 'test');
		expect(URL.createObjectURL).toHaveBeenCalledOnce();
		expect(lastBlob!.type).toBe('text/csv');
	});

	it('sets href and download on the anchor element', async () => {
		await exportCsv(rows, allColumns, identityRename, 'stem');
		expect(lastAnchor!.href).toBe('blob:mock-url');
		expect(lastAnchor!.download).toBe('stem.csv');
	});

	it('clicks the anchor element', async () => {
		await exportCsv(rows, allColumns, identityRename, 'test');
		expect(lastAnchor!.click).toHaveBeenCalledOnce();
	});

	it('revokes the object URL after clicking', async () => {
		await exportCsv(rows, allColumns, identityRename, 'test');
		expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
	});
});

describe('exportCsv — File System Access API path', () => {
	const makeWritable = () => ({
		write: vi.fn().mockResolvedValue(undefined),
		close: vi.fn().mockResolvedValue(undefined)
	});

	it('writes the blob and closes the writable', async () => {
		const writable = makeWritable();
		const handle = { createWritable: vi.fn().mockResolvedValue(writable) };
		vi.stubGlobal('showSaveFilePicker', vi.fn().mockResolvedValue(handle));

		await exportCsv(rows, allColumns, identityRename, 'test');

		expect(handle.createWritable).toHaveBeenCalledOnce();
		expect(writable.write).toHaveBeenCalledOnce();
		expect(writable.close).toHaveBeenCalledOnce();
	});

	it('does not fall back to the download link on success', async () => {
		const writable = makeWritable();
		const handle = { createWritable: vi.fn().mockResolvedValue(writable) };
		vi.stubGlobal('showSaveFilePicker', vi.fn().mockResolvedValue(handle));

		await exportCsv(rows, allColumns, identityRename, 'test');

		expect(URL.createObjectURL).not.toHaveBeenCalled();
	});

	it('swallows AbortError silently without falling back', async () => {
		const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
		vi.stubGlobal('showSaveFilePicker', vi.fn().mockRejectedValue(abort));

		await expect(exportCsv(rows, allColumns, identityRename, 'test')).resolves.toBeUndefined();
		expect(URL.createObjectURL).not.toHaveBeenCalled();
	});

	it('falls back to download link on non-abort picker error', async () => {
		const err = new Error('permission denied');
		vi.stubGlobal('showSaveFilePicker', vi.fn().mockRejectedValue(err));

		await exportCsv(rows, allColumns, identityRename, 'test');

		expect(URL.createObjectURL).toHaveBeenCalledOnce();
		expect(lastAnchor!.click).toHaveBeenCalledOnce();
	});

	it('passes the correct suggestedName to showSaveFilePicker', async () => {
		const picker = vi.fn().mockRejectedValue(Object.assign(new Error(), { name: 'AbortError' }));
		vi.stubGlobal('showSaveFilePicker', picker);

		await exportCsv(rows, allColumns, identityRename, 'my-file');

		expect(picker).toHaveBeenCalledWith(
			expect.objectContaining({ suggestedName: 'my-file.csv' })
		);
	});
});
