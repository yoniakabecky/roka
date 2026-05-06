import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// ---------------------------------------------------------------------------
// vi.mock is hoisted to the top of the file, so factories must not reference
// variables declared in module scope. Use inline vi.fn() only.
// ---------------------------------------------------------------------------
vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));
vi.mock('jspdf', () => ({
	jsPDF: vi.fn(function (this: Record<string, unknown>) {
		this.addFileToVFS = vi.fn();
		this.addFont = vi.fn();
		this.output = vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' }));
		this.save = vi.fn();
	})
}));
vi.mock('$lib/csv-studio/woff-to-ttf', () => ({
	woffToBase64Ttf: vi.fn().mockResolvedValue('mock-font-base64')
}));
vi.mock('@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff?url', () => ({
	default: 'mock-woff-url'
}));

import { exportPdf } from '$lib/csv-studio/export-pdf';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ---------------------------------------------------------------------------

const rows = [
	{ name: 'Alice', score: '95', city: 'Tokyo' },
	{ name: 'Bob', score: '80', city: 'Osaka' }
];
const allColumns = ['name', 'score', 'city'];
const identityRename = Object.fromEntries(allColumns.map((c) => [c, c]));

// Get the mock doc instance created during the most recent exportPdf call.
// When called with `new`, mock.instances holds the constructed `this` objects.
type MockDoc = { addFileToVFS: Mock; addFont: Mock; output: Mock; save: Mock };
const lastDoc = () => (jsPDF as unknown as Mock).mock.instances[0] as MockDoc;

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal('window', globalThis);
	vi.stubGlobal('showSaveFilePicker', undefined);
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({ arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)) })
	);
});

// ---------------------------------------------------------------------------

describe('exportPdf — header and body construction', () => {
	it('passes renamed headers as autoTable head', async () => {
		const rename = { name: 'Full Name', score: 'Score', city: 'City' };
		await exportPdf(rows, allColumns, rename, 'test');
		const { head } = (autoTable as unknown as Mock).mock.calls[0][1];
		expect(head).toEqual([['Full Name', 'Score', 'City']]);
	});

	it('falls back to original name when rename is identity', async () => {
		await exportPdf(rows, allColumns, identityRename, 'test');
		const { head } = (autoTable as unknown as Mock).mock.calls[0][1];
		expect(head).toEqual([['name', 'score', 'city']]);
	});

	it('falls back to original name when column is absent from colRename', async () => {
		// colRename[c] is undefined → ?? c uses the original column name
		const partialRename = { name: 'Full Name' } as Record<string, string>;
		await exportPdf(rows, allColumns, partialRename, 'test');
		const { head } = (autoTable as unknown as Mock).mock.calls[0][1];
		expect(head).toEqual([['Full Name', 'score', 'city']]);
	});

	it('projects body rows to visible columns in order', async () => {
		await exportPdf(rows, ['name', 'city'], identityRename, 'test');
		const { body } = (autoTable as unknown as Mock).mock.calls[0][1];
		expect(body).toEqual([
			['Alice', 'Tokyo'],
			['Bob', 'Osaka']
		]);
	});

	it('defaults missing cell values to empty string', async () => {
		const sparse = [{ name: 'Alice' }] as Record<string, string>[];
		await exportPdf(sparse, allColumns, identityRename, 'test');
		const { body } = (autoTable as unknown as Mock).mock.calls[0][1];
		expect(body[0]).toEqual(['Alice', '', '']);
	});
});

describe('exportPdf — font registration', () => {
	it('registers the NotoSansJP font on the jsPDF instance', async () => {
		await exportPdf(rows, allColumns, identityRename, 'test');
		const doc = lastDoc();
		expect(doc.addFileToVFS).toHaveBeenCalledWith('NotoSansJP.ttf', 'mock-font-base64');
		expect(doc.addFont).toHaveBeenCalledWith('NotoSansJP.ttf', 'NotoSansJP', 'normal');
	});
});

describe('exportPdf — font caching', () => {
	// The module-level font cache persists across tests. Each test in this block
	// gets a fresh module instance so the cache starts cold.

	const makeFreshExportPdf = async () => {
		vi.resetModules();
		vi.doMock('jspdf-autotable', () => ({ default: vi.fn() }));
		vi.doMock('jspdf', () => ({
			jsPDF: vi.fn(function (this: Record<string, unknown>) {
				this.addFileToVFS = vi.fn();
				this.addFont = vi.fn();
				this.output = vi.fn(() => new Blob());
				this.save = vi.fn();
			})
		}));
		vi.doMock('$lib/csv-studio/woff-to-ttf', () => ({
			woffToBase64Ttf: vi.fn().mockResolvedValue('mock-font-base64')
		}));
		vi.doMock('@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff?url', () => ({
			default: 'mock-woff-url'
		}));
		const mod = await import('$lib/csv-studio/export-pdf');
		return mod.exportPdf;
	};

	it('fetches the WOFF URL on the first export', async () => {
		const localExportPdf = await makeFreshExportPdf();
		await localExportPdf(rows, allColumns, identityRename, 'test');
		expect(fetch).toHaveBeenCalledWith('mock-woff-url');
	});

	it('does not re-fetch on the second export (cache hit)', async () => {
		const localExportPdf = await makeFreshExportPdf();
		await localExportPdf(rows, allColumns, identityRename, 'test');
		await localExportPdf(rows, allColumns, identityRename, 'test');
		expect(fetch).toHaveBeenCalledOnce();
	});
});

describe('exportPdf — jsPDF configuration', () => {
	it('creates jsPDF in landscape orientation', async () => {
		await exportPdf(rows, allColumns, identityRename, 'test');
		expect(jsPDF as unknown as Mock).toHaveBeenCalledWith({ orientation: 'landscape' });
	});

	it('passes horizontalPageBreak: true to autoTable', async () => {
		await exportPdf(rows, allColumns, identityRename, 'test');
		const options = (autoTable as unknown as Mock).mock.calls[0][1];
		expect(options.horizontalPageBreak).toBe(true);
	});
});

describe('exportPdf — File System Access API path', () => {
	const makeWritable = () => ({
		write: vi.fn().mockResolvedValue(undefined),
		close: vi.fn().mockResolvedValue(undefined)
	});

	it('writes the PDF blob and closes the writable', async () => {
		const writable = makeWritable();
		const handle = { createWritable: vi.fn().mockResolvedValue(writable) };
		vi.stubGlobal('showSaveFilePicker', vi.fn().mockResolvedValue(handle));

		await exportPdf(rows, allColumns, identityRename, 'test');

		expect(handle.createWritable).toHaveBeenCalledOnce();
		expect(writable.write).toHaveBeenCalledOnce();
		expect(writable.close).toHaveBeenCalledOnce();
	});

	it('does not call doc.save on File System Access API success', async () => {
		const writable = makeWritable();
		const handle = { createWritable: vi.fn().mockResolvedValue(writable) };
		vi.stubGlobal('showSaveFilePicker', vi.fn().mockResolvedValue(handle));

		await exportPdf(rows, allColumns, identityRename, 'test');

		expect(lastDoc().save).not.toHaveBeenCalled();
	});

	it('swallows AbortError silently without calling doc.save', async () => {
		const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
		vi.stubGlobal('showSaveFilePicker', vi.fn().mockRejectedValue(abort));

		await expect(exportPdf(rows, allColumns, identityRename, 'test')).resolves.toBeUndefined();
		expect(lastDoc().save).not.toHaveBeenCalled();
	});

	it('falls back to doc.save on non-abort picker error', async () => {
		const err = new Error('permission denied');
		vi.stubGlobal('showSaveFilePicker', vi.fn().mockRejectedValue(err));

		await exportPdf(rows, allColumns, identityRename, 'test');

		expect(lastDoc().save).toHaveBeenCalledWith('test.pdf');
	});

	it('passes the correct suggestedName to showSaveFilePicker', async () => {
		const picker = vi.fn().mockRejectedValue(Object.assign(new Error(), { name: 'AbortError' }));
		vi.stubGlobal('showSaveFilePicker', picker);

		await exportPdf(rows, allColumns, identityRename, 'my-report');

		expect(picker).toHaveBeenCalledWith(
			expect.objectContaining({ suggestedName: 'my-report.pdf' })
		);
	});
});

describe('exportPdf — fallback path (no File System Access API)', () => {
	it('calls doc.save with stem.pdf', async () => {
		await exportPdf(rows, allColumns, identityRename, 'report');
		expect(lastDoc().save).toHaveBeenCalledWith('report.pdf');
	});
});
