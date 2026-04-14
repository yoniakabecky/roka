import Papa from 'papaparse';
import { SvelteDate } from 'svelte/reactivity';
import { toast } from 'svelte-sonner';
import { exportCsv } from '$lib/csv-studio/export-csv';
import { exportPdf } from '$lib/csv-studio/export-pdf';

const createCsvStudio = () => {
	let columns = $state<string[]>([]);
	let rows = $state<Record<string, string>[]>([]);
	let colVisible = $state<Record<string, boolean>>({});
	let colFiltersOpen = $state<Record<string, boolean>>({});
	let colFilters = $state<Record<string, string[]>>({});
	let colDateFilters = $state<Record<string, { from: string; to: string }>>({});
	let colRename = $state<Record<string, string>>({});
	let loading = $state(false);
	let filename = $state('');

	const visibleColumns = $derived(columns.filter((c) => colVisible[c]));

	const activeFilters = $derived(Object.entries(colFilters).filter(([, vals]) => vals.length > 0));

	const activeDateFilters = $derived(
		Object.entries(colDateFilters).filter(([, { from, to }]) => from !== '' || to !== '')
	);

	const filteredRows = $derived(
		(() => {
			let result = rows;
			if (activeFilters.length > 0) {
				result = result.filter((row) =>
					activeFilters.every(([col, vals]) => vals.includes(row[col] ?? ''))
				);
			}
			if (activeDateFilters.length > 0) {
				result = result.filter((row) =>
					activeDateFilters.every(([col, { from, to }]) => {
						const cellVal = row[col] ?? '';
						if (cellVal === '') return false;
						const cellDate = new SvelteDate(cellVal);
						if (isNaN(cellDate.getTime())) return false;
						if (from !== '') {
							const fromDate = new SvelteDate(from);
							if (!isNaN(fromDate.getTime()) && cellDate < fromDate) return false;
						}
						if (to !== '') {
							const endOfDay = new SvelteDate(`${to}T23:59:59.999`);
							if (!isNaN(endOfDay.getTime()) && cellDate > endOfDay) return false;
						}
						return true;
					})
				);
			}
			return result;
		})()
	);

	const colUniqueValues = $derived(
		Object.fromEntries(
			columns.map((c) => [
				c,
				[...new Set(rows.map((r) => r[c] ?? '').filter(Boolean))].slice(0, 200)
			])
		)
	);

	const isLikelyDate = (samples: string[]): boolean => {
		if (samples.length === 0) return false;
		const checked = samples.slice(0, 50);
		const validCount = checked.filter((v) => {
			if (/^\d+$/.test(v)) return false;
			const d = new Date(v);
			return !isNaN(d.getTime());
		}).length;
		return validCount / checked.length >= 0.8;
	};

	const dateColumns = $derived(
		new Set(columns.filter((c) => isLikelyDate(colUniqueValues[c] ?? [])))
	);

	const exportStem = $derived(
		(() => {
			const base = filename.replace(/\.[^.]+$/, '');
			return base ? `${base}_roka` : 'export_roka';
		})()
	);

	const clearData = () => {
		columns = [];
		rows = [];
		colVisible = {};
		colFiltersOpen = {};
		colFilters = {};
		colDateFilters = {};
		colRename = {};
		filename = '';
	};

	const handleFile = (file: File) => {
		filename = file.name;
		loading = true;
		Papa.parse<Record<string, string>>(file, {
			header: true,
			skipEmptyLines: true,
			dynamicTyping: false,
			worker: true,
			complete: (result) => {
				columns = result.meta.fields ?? [];
				colVisible = Object.fromEntries(columns.map((c) => [c, true]));
				colFiltersOpen = {};
				colFilters = Object.fromEntries(columns.map((c) => [c, []]));
				colDateFilters = Object.fromEntries(columns.map((c) => [c, { from: '', to: '' }]));
				colRename = Object.fromEntries(columns.map((c) => [c, c]));
				rows = result.data;
				loading = false;
				toast.success(`Imported ${filename}`);
			}
		});
	};

	const resetColRename = () => {
		colRename = Object.fromEntries(columns.map((c) => [c, c]));
	};

	const doExportCsv = async () => {
		await exportCsv(filteredRows, visibleColumns, colRename, exportStem);
		toast.success(`Exported ${exportStem}.csv`);
	};
	const doExportPdf = async () => {
		await exportPdf(filteredRows, visibleColumns, colRename, exportStem);
		toast.success(`Exported ${exportStem}.pdf`);
	};

	return {
		get columns() {
			return columns;
		},
		get rows() {
			return rows;
		},
		get colVisible() {
			return colVisible;
		},
		get colFiltersOpen() {
			return colFiltersOpen;
		},
		get colFilters() {
			return colFilters;
		},
		get colDateFilters() {
			return colDateFilters;
		},
		get colRename() {
			return colRename;
		},
		get loading() {
			return loading;
		},
		get filename() {
			return filename;
		},
		get visibleColumns() {
			return visibleColumns;
		},
		get filteredRows() {
			return filteredRows;
		},
		get colUniqueValues() {
			return colUniqueValues;
		},
		get dateColumns() {
			return dateColumns;
		},
		get exportStem() {
			return exportStem;
		},
		clearData,
		handleFile,
		resetColRename,
		doExportCsv,
		doExportPdf
	};
};

const csvStudio = createCsvStudio();
export const useCsvStudio = () => csvStudio;
