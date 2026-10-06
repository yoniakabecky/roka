import { describe, it, expect, beforeEach, vi } from 'vitest';
import Encoding from 'encoding-japanese';
import { toast } from 'svelte-sonner';
import { loadLocale } from 'wuchale/load-utils';
import { exportCsv } from '#lib/csv-studio/export-csv.js';
import { exportPdf } from '#lib/csv-studio/export-pdf.js';
import type { SavedFilter } from './csv-studio.svelte';

vi.mock('svelte-sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() }
}));
vi.mock('#lib/csv-studio/export-csv.js', () => ({ exportCsv: vi.fn() }));
vi.mock('#lib/csv-studio/export-pdf.js', () => ({ exportPdf: vi.fn() }));

const CSV = [
	'name,city,qty,date',
	'Apple,Tokyo,10,2026-01-05',
	'Banana,Osaka,2,2026-02-10',
	'Cherry,Tokyo,100,2026-03-15',
	'Durian,,7,2026-04-20'
].join('\n');

const csvFile = (text = CSV, name = 'fruits.csv') => new File([text], name, { type: 'text/csv' });

// csv-studio.svelte.ts exports one shared state. A unique query makes Vite load a new copy of the
// module, so each test gets its own state.
let fresh = 0;
const freshStudio = async () => {
	// +layout.ts loads the catalog in the app; without it toasts show "[i18n-404:…]".
	await loadLocale('en');
	const mod: typeof import('./csv-studio.svelte') = await import(
		/* @vite-ignore */ `${new URL('./csv-studio.svelte.ts', import.meta.url).pathname}?fresh=${fresh++}`
	);
	return mod.useCsvStudio();
};

type Studio = Awaited<ReturnType<typeof freshStudio>>;

const loaded = async (file = csvFile()) => {
	const studio = await freshStudio();
	await studio.handleFile(file);
	return studio;
};

// Filtering runs in a setTimeout, so wait for it to settle.
const settled = (studio: Studio) => vi.waitFor(() => expect(studio.filtering).toBe(false));

const names = (rows: Record<string, string>[]) => rows.map((r) => r.name);

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
});

describe('handleFile', () => {
	it('loads columns, rows and file name', async () => {
		const studio = await loaded();
		expect(studio.columns).toEqual(['name', 'city', 'qty', 'date']);
		expect(studio.rows).toHaveLength(4);
		expect(studio.filteredRows).toHaveLength(4);
		expect(studio.filename).toBe('fruits.csv');
		expect(studio.loading).toBe(false);
		expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('fruits.csv'));
	});

	it('shows all columns and keeps original names', async () => {
		const studio = await loaded();
		expect(studio.visibleColumns).toEqual(studio.columns);
		expect(studio.hasHiddenColumns).toBe(false);
		expect(studio.colRename).toEqual({ name: 'name', city: 'city', qty: 'qty', date: 'date' });
	});

	it('detects date columns', async () => {
		const studio = await loaded();
		expect([...studio.dateColumns]).toEqual(['date']);
	});

	it('decodes Shift-JIS files', async () => {
		const sjis = Encoding.convert(Encoding.stringToCode('名前,都市\n山田,東京'), {
			to: 'SJIS',
			from: 'UNICODE'
		});
		const studio = await loaded(new File([new Uint8Array(sjis)], 'jp.csv'));
		expect(studio.columns).toEqual(['名前', '都市']);
		expect(studio.rows[0]).toEqual({ 名前: '山田', 都市: '東京' });
	});

	it('shows an error toast when the file cannot be read', async () => {
		const studio = await freshStudio();
		const file = csvFile();
		vi.spyOn(file, 'arrayBuffer').mockRejectedValue(new Error('read failed'));
		await studio.handleFile(file);
		expect(studio.loading).toBe(false);
		expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('fruits.csv'));
	});
});

describe('filters', () => {
	it('filters rows by column value', async () => {
		const studio = await loaded();
		studio.colFilters.city = ['Tokyo'];
		await settled(studio);
		await vi.waitFor(() => expect(names(studio.filteredRows)).toEqual(['Apple', 'Cherry']));
		expect(studio.activeFilters).toEqual([['city', ['Tokyo']]]);
	});

	it('filters rows by date range', async () => {
		const studio = await loaded();
		studio.colDateFilters.date = { from: '2026-02-01', to: '2026-03-31' };
		await vi.waitFor(() => expect(names(studio.filteredRows)).toEqual(['Banana', 'Cherry']));
	});

	it('filters empty and non-empty values', async () => {
		const studio = await loaded();
		studio.colEmptyFilters.city = 'empty';
		await vi.waitFor(() => expect(names(studio.filteredRows)).toEqual(['Durian']));
		studio.colEmptyFilters.city = 'nonempty';
		await vi.waitFor(() => expect(studio.filteredRows).toHaveLength(3));
	});

	it('resets the empty filter when a value filter is set on the same column', async () => {
		const studio = await loaded();
		studio.colEmptyFilters.city = 'nonempty';
		studio.colFilters.city = ['Osaka'];
		await vi.waitFor(() => expect(studio.colEmptyFilters.city).toBeNull());
		await vi.waitFor(() => expect(names(studio.filteredRows)).toEqual(['Banana']));
	});

	it('offers dropdown values only for open filters', async () => {
		const studio = await loaded();
		expect(studio.colAvailableValues).toEqual({});
		studio.colFiltersOpen.city = true;
		expect(Object.keys(studio.colAvailableValues)).toEqual(['city']);
	});

	it('resetFilters clears all filters', async () => {
		const studio = await loaded();
		studio.colFilters.city = ['Tokyo'];
		studio.colVisible.qty = false;
		studio.resetFilters();
		expect(studio.activeFilters).toEqual([]);
		expect(studio.hasHiddenColumns).toBe(false);
		await vi.waitFor(() => expect(studio.filteredRows).toHaveLength(4));
	});
});

describe('columns', () => {
	it('hides columns', async () => {
		const studio = await loaded();
		studio.colVisible.qty = false;
		expect(studio.visibleColumns).toEqual(['name', 'city', 'date']);
		expect(studio.hasHiddenColumns).toBe(true);
	});

	it('resetColRename restores original names', async () => {
		const studio = await loaded();
		studio.colRename.city = 'City';
		studio.resetColRename();
		expect(studio.colRename.city).toBe('city');
	});
});

describe('sorting', () => {
	it('sorts numbers by value, not as text', async () => {
		const studio = await loaded();
		await settled(studio);
		studio.handleSort('qty');
		expect(studio.sortedRows.map((r) => r.qty)).toEqual(['2', '7', '10', '100']);
	});

	it('toggles direction when the same column is sorted again', async () => {
		const studio = await loaded();
		await settled(studio);
		studio.handleSort('name');
		studio.handleSort('name');
		expect(studio.sortDir).toBe('desc');
		expect(names(studio.sortedRows)).toEqual(['Durian', 'Cherry', 'Banana', 'Apple']);
	});

	it('resets to ascending when a new column is sorted', async () => {
		const studio = await loaded();
		studio.handleSort('name');
		studio.handleSort('name');
		studio.handleSort('city');
		expect(studio.sortCol).toBe('city');
		expect(studio.sortDir).toBe('asc');
	});
});

describe('export', () => {
	it('names the export after the file', async () => {
		const studio = await loaded();
		expect(studio.exportStem).toBe('fruits_roka');
	});

	it('uses "export" when there is no file name', async () => {
		const studio = await freshStudio();
		expect(studio.exportStem).toBe('export_roka');
	});

	it('exports visible columns with renames as CSV', async () => {
		const studio = await loaded();
		await settled(studio);
		studio.colVisible.qty = false;
		await studio.doExportCsv();
		expect(exportCsv).toHaveBeenCalledWith(
			studio.sortedRows,
			['name', 'city', 'date'],
			studio.colRename,
			'fruits_roka'
		);
		expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('fruits_roka.csv'));
	});

	it('shows an error toast when CSV export fails', async () => {
		const studio = await loaded();
		vi.mocked(exportCsv).mockRejectedValueOnce(new Error('cancelled'));
		await studio.doExportCsv();
		expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('fruits_roka.csv'));
	});

	it('exports PDF', async () => {
		const studio = await loaded();
		await studio.doExportPdf();
		expect(exportPdf).toHaveBeenCalledOnce();
		expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('fruits_roka.pdf'));
	});

	it('shows an error toast when PDF export fails', async () => {
		const studio = await loaded();
		vi.mocked(exportPdf).mockRejectedValueOnce(new Error('font'));
		await studio.doExportPdf();
		expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('fruits_roka.pdf'));
	});
});

describe('presets', () => {
	const stored = (): SavedFilter[] =>
		JSON.parse(localStorage.getItem('csv-studio-saved-filters') ?? '[]');

	it('saves the current filters and remembers them as applied', async () => {
		const studio = await loaded();
		studio.colFilters.city = ['Tokyo'];
		studio.colVisible.qty = false;
		expect(studio.saveCurrentFilter('Tokyo only')).toEqual({});
		expect(studio.savedFilters.map((f) => f.name)).toEqual(['Tokyo only']);
		expect(stored()[0].colFilters.city).toEqual(['Tokyo']);
		expect(stored()[0].colVisible.qty).toBe(false);
		expect(studio.appliedPresetName).toBe('Tokyo only');
		expect(studio.isPresetModified).toBe(false);
	});

	it('marks the preset as modified when filters change', async () => {
		const studio = await loaded();
		studio.saveCurrentFilter('p');
		studio.colFilters.city = ['Osaka'];
		expect(studio.isPresetModified).toBe(true);
	});

	it('overwrites a preset with the same name', async () => {
		const studio = await loaded();
		studio.saveCurrentFilter('p');
		studio.colFilters.city = ['Osaka'];
		studio.saveCurrentFilter('p');
		expect(studio.savedFilters).toHaveLength(1);
		expect(studio.savedFilters[0].colFilters.city).toEqual(['Osaka']);
	});

	it('refuses an 11th preset but allows overwriting at the limit', async () => {
		const studio = await loaded();
		for (let i = 0; i < 10; i++) studio.saveCurrentFilter(`p${i}`);
		expect(studio.saveCurrentFilter('one more').error).toBeTruthy();
		expect(studio.savedFilters).toHaveLength(10);
		expect(studio.saveCurrentFilter('p3')).toEqual({});
	});

	it('loads presets saved in an earlier session', async () => {
		const preset: SavedFilter = {
			name: 'old',
			colFilters: { city: ['Osaka'] },
			colDateFilters: {},
			colVisible: {}
		};
		localStorage.setItem('csv-studio-saved-filters', JSON.stringify([preset]));
		const studio = await loaded();
		expect(studio.savedFilters).toEqual([preset]);
	});

	it('applies a preset, keeping only values that exist in this file', async () => {
		const studio = await loaded();
		const result = studio.loadSavedFilter({
			name: 'mixed',
			colFilters: { city: ['Tokyo', 'Kyoto'], missingCol: ['x'] },
			colDateFilters: {},
			colVisible: { qty: false }
		});
		expect(result).toEqual({ noMatch: false });
		expect(studio.colFilters.city).toEqual(['Tokyo']);
		expect(studio.colVisible).toEqual({ name: true, city: true, qty: false, date: true });
		expect(studio.appliedPresetName).toBe('mixed');
		await vi.waitFor(() => expect(names(studio.filteredRows)).toEqual(['Apple', 'Cherry']));
	});

	it('applies a date range from a preset', async () => {
		const studio = await loaded();
		const range = { from: '2026-03-01', to: '' };
		expect(
			studio.loadSavedFilter({
				name: 'd',
				colFilters: {},
				colDateFilters: { date: range },
				colVisible: {}
			})
		).toEqual({ noMatch: false });
		expect(studio.colDateFilters.date).toEqual(range);
	});

	it('reports noMatch when nothing in the preset fits this file', async () => {
		const studio = await loaded();
		const result = studio.loadSavedFilter({
			name: 'other',
			colFilters: { city: ['Kyoto'] },
			colDateFilters: {},
			colVisible: {}
		});
		expect(result).toEqual({ noMatch: true });
		expect(studio.appliedPresetName).toBeNull();
	});

	it('deletes a preset', async () => {
		const studio = await loaded();
		studio.saveCurrentFilter('a');
		studio.saveCurrentFilter('b');
		studio.deleteSavedFilter('a');
		expect(studio.savedFilters.map((f) => f.name)).toEqual(['b']);
		expect(stored().map((f) => f.name)).toEqual(['b']);
	});

	describe('renameSavedFilter', () => {
		it('renames and keeps it applied', async () => {
			const studio = await loaded();
			studio.saveCurrentFilter('a');
			expect(studio.renameSavedFilter('a', '  b  ')).toEqual({});
			expect(studio.savedFilters.map((f) => f.name)).toEqual(['b']);
			expect(stored()[0].name).toBe('b');
			expect(studio.appliedPresetName).toBe('b');
		});

		it('does nothing when the name is unchanged', async () => {
			const studio = await loaded();
			studio.saveCurrentFilter('a');
			expect(studio.renameSavedFilter('a', 'a')).toEqual({});
		});

		it('refuses an empty name', async () => {
			const studio = await loaded();
			studio.saveCurrentFilter('a');
			expect(studio.renameSavedFilter('a', '   ').error).toBeTruthy();
		});

		it('refuses a name that already exists', async () => {
			const studio = await loaded();
			studio.saveCurrentFilter('a');
			studio.saveCurrentFilter('b');
			expect(studio.renameSavedFilter('a', 'b').error).toBeTruthy();
		});
	});
});

describe('clearData', () => {
	it('removes the file and all state', async () => {
		const studio = await loaded();
		studio.colFilters.city = ['Tokyo'];
		studio.saveCurrentFilter('p');
		studio.clearData();
		expect(studio.columns).toEqual([]);
		expect(studio.rows).toEqual([]);
		expect(studio.filteredRows).toEqual([]);
		expect(studio.filename).toBe('');
		expect(studio.appliedPresetName).toBeNull();
		// saved presets are kept
		expect(studio.savedFilters).toHaveLength(1);
	});
});
