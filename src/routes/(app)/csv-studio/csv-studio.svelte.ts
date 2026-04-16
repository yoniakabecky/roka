import Papa from 'papaparse';
import { toast } from 'svelte-sonner';
import { exportCsv } from '$lib/csv-studio/export-csv';
import { exportPdf } from '$lib/csv-studio/export-pdf';
import {
	isLikelyDate,
	buildColumnIndex,
	computeFilteredRows,
	computeCrossFilteredValues,
	type FullIndex
} from '$lib/csv-studio/detect-columns';

const LOCALE_SORT_OPTS: Intl.CollatorOptions = { numeric: true, sensitivity: 'base' };

const createCsvStudio = () => {
	let columns = $state<string[]>([]);
	let rows = $state<Record<string, string>[]>([]);
	let columnIndex = $state<FullIndex>(new Map());
	let colVisible = $state<Record<string, boolean>>({});
	let colFiltersOpen = $state<Record<string, boolean>>({});
	let colFilters = $state<Record<string, string[]>>({});
	let colDateFilters = $state<Record<string, { from: string; to: string }>>({});
	let colRename = $state<Record<string, string>>({});
	let loading = $state(false);
	let filename = $state('');
	let filteredRows = $state<Record<string, string>[]>([]);
	let filtering = $state(false);
	let sortCol = $state<string | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');

	const visibleColumns = $derived(columns.filter((c) => colVisible[c]));

	const activeFilters = $derived(Object.entries(colFilters).filter(([, vals]) => vals.length > 0));

	const activeDateFilters = $derived(
		Object.entries(colDateFilters).filter(([, { from, to }]) => from !== '' || to !== '')
	);

	const dateColumns = $derived(
		new Set(columns.filter((c) => isLikelyDate([...(columnIndex.get(c)?.keys() ?? [])])))
	);

	const colAvailableValues = $derived(
		Object.fromEntries(
			columns
				.filter((c) => colFiltersOpen[c])
				.map((c) => [
					c,
					computeCrossFilteredValues(c, rows, columnIndex, activeFilters, activeDateFilters)
				])
		)
	);

	const exportStem = $derived((filename.replace(/\.[^.]+$/, '') || 'export') + '_roka');

	const sortedRows = $derived.by(() => {
		const col = sortCol;
		if (!col) return filteredRows;
		return [...filteredRows].sort((a, b) => {
			const av = a[col] ?? '';
			const bv = b[col] ?? '';
			const an = Number(av);
			const bn = Number(bv);
			// CSV values are always strings. Use numeric comparison when both parse as
			// numbers ("2" < "10" < "100"), otherwise fall back to localeCompare.
			// The Number() fast-path avoids the cost of localeCompare on numeric columns.
			const cmp =
				!isNaN(an) && !isNaN(bn)
					? an - bn
					: av.localeCompare(bv, undefined, LOCALE_SORT_OPTS);
			return sortDir === 'asc' ? cmp : -cmp;
		});
	});

	$effect.root(() => {
		$effect(() => {
			// Snapshot reactive values before the setTimeout boundary — Svelte only
			// tracks reads that happen synchronously within the effect body.
			const activeValueFilters = activeFilters.map(
				([col, vals]) => [col, [...vals]] as [string, string[]]
			);
			const activeDateFiltersCopy = activeDateFilters.map(
				([col, range]) => [col, { ...range }] as [string, { from: string; to: string }]
			);
			const currentRows = rows;
			const currentIndex = columnIndex;

			filtering = true;
			const id = setTimeout(() => {
				filteredRows = computeFilteredRows(
					currentRows,
					currentIndex,
					activeValueFilters,
					activeDateFiltersCopy
				);
				filtering = false;
			}, 0);

			// Cancel the pending computation if filters change before it fires.
			return () => clearTimeout(id);
		});
	});

	const clearData = () => {
		columns = [];
		rows = [];
		columnIndex = new Map();
		colVisible = {};
		colFiltersOpen = {};
		colFilters = {};
		colDateFilters = {};
		colRename = {};
		filename = '';
		filteredRows = [];
		filtering = false;
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
				columnIndex = buildColumnIndex(result.data, columns);
				filteredRows = result.data;
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

	const handleSort = (col: string) => {
		if (sortCol === col) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortCol = col;
			sortDir = 'asc';
		}
	};

	const doExportCsv = async () => {
		try {
			await exportCsv(sortedRows, visibleColumns, colRename, exportStem);
			toast.success(`Exported ${exportStem}.csv`);
		} catch {
			toast.error(`Failed to export ${exportStem}.csv`);
		}
	};

	const doExportPdf = async () => {
		try {
			await exportPdf(sortedRows, visibleColumns, colRename, exportStem);
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
		get colAvailableValues() {
			return colAvailableValues;
		},
		get dateColumns() {
			return dateColumns;
		},
		get exportStem() {
			return exportStem;
		},
		get filtering() {
			return filtering;
		},
		get sortCol() {
			return sortCol;
		},
		get sortDir() {
			return sortDir;
		},
		get sortedRows() {
			return sortedRows;
		},
		clearData,
		handleFile,
		resetColRename,
		handleSort,
		doExportCsv,
		doExportPdf
	};
};

const csvStudio = createCsvStudio();
export const useCsvStudio = () => csvStudio;
