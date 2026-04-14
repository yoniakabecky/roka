import Papa from 'papaparse';
import { toast } from 'svelte-sonner';
import { exportCsv } from '$lib/csv-studio/export-csv';
import { exportPdf } from '$lib/csv-studio/export-pdf';
import { isLikelyDate, isMatchesDateFilters } from '$lib/csv-studio/detect-columns';

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

	const filteredRows = $derived.by(() => {
		let result = rows;
		if (activeFilters.length > 0) {
			result = result.filter((row) =>
				activeFilters.every(([col, vals]) => vals.includes(row[col] ?? ''))
			);
		}
		if (activeDateFilters.length > 0) {
			result = result.filter((row) => isMatchesDateFilters(row, activeDateFilters));
		}
		return result;
	});

	const colUniqueValues = $derived(
		Object.fromEntries(
			columns.map((c) => [
				c,
				[...new Set(rows.map((r) => r[c] ?? '').filter(Boolean))].slice(0, 200)
			])
		)
	);

	const dateColumns = $derived(
		new Set(columns.filter((c) => isLikelyDate(colUniqueValues[c] ?? [])))
	);

	const exportStem = $derived((filename.replace(/\.[^.]+$/, '') || 'export') + '_roka');

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
			},
			error: () => {
				loading = false;
				toast.error(`Failed to import ${filename}`);
			}
		});
	};

	const resetColRename = () => {
		colRename = Object.fromEntries(columns.map((c) => [c, c]));
	};

	const doExportCsv = async () => {
		try {
			await exportCsv(filteredRows, visibleColumns, colRename, exportStem);
			toast.success(`Exported ${exportStem}.csv`);
		} catch {
			toast.error(`Failed to export ${exportStem}.csv`);
		}
	};

	const doExportPdf = async () => {
		try {
			await exportPdf(filteredRows, visibleColumns, colRename, exportStem);
			toast.success(`Exported ${exportStem}.pdf`);
		} catch {
			toast.error(`Failed to export ${exportStem}.pdf`);
		}
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
